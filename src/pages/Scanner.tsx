import React, { useState, useEffect, useRef } from 'react';
import { Camera, ArrowLeft, Loader2, CheckCircle2, X, Plus, Upload, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays } from 'date-fns';
import { getRemainingScans, incrementScans } from '../lib/limits';
import { auth } from '../lib/firebase';
import { CustomCalendar } from '../components/CustomCalendar';
import { useLanguage } from '../contexts/LanguageContext';

const FOOD_SHELF_LIFE: Record<string, number> = {
  'MILK': 7,
  'EGGS': 21,
  'BREAD': 5,
  'APPLE': 14,
  'CHICKEN': 3,
  'BEEF': 3,
  'FISH': 2,
};

type ViewState = 'inventory' | 'scanner' | 'add-item';

export interface DetectedItem {
  id: string;
  name: string;
  price: string;
  category: string;
  quantity: string;
  expiryDate: string;
  storeName: string;
  purchaseDate: string;
}

interface ScannerProps {
  onViewChange: (view: ViewState) => void;
  onItemsAdded: (items: any[]) => void;
}

export default function Scanner({ onViewChange, onItemsAdded }: ScannerProps) {
  const { t, language } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<DetectedItem | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [remainingScans, setRemainingScans] = useState<number>(2);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  
  // Tab selector: 'camera' | 'album'
  const [scanTab, setScanTab] = useState<'camera' | 'album'>(() => {
    try {
      return (typeof window !== 'undefined' && window.self !== window.top) ? 'album' : 'camera';
    } catch (e) {
      return 'album';
    }
  });

  // Camera initialization conditional on scanTab === 'camera'
  useEffect(() => {
    if (scanTab !== 'camera') {
      setIsReady(false);
      if (stream) {
        stream.getTracks().forEach(track => {
          try { track.stop(); } catch (e) {}
        });
      }
      setStream(null);
      return;
    }

    let activeStream: MediaStream | null = null;
    let timeoutId: any = null;

    async function startCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera API not supported in this browser context. Try uploading standard image instead.');
        }
        const timeoutPromise = new Promise<MediaStream>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Camera initialization timed out (3s limit reached).'));
          }, 3000);
        });
        const mediaStream = await Promise.race([
          navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' }, 
            audio: false 
          }),
          timeoutPromise
        ]);
        if (timeoutId) clearTimeout(timeoutId);
        activeStream = mediaStream;
        setStream(mediaStream);
        setIsReady(true);
        setError(null);
      } catch (err: any) {
        if (timeoutId) clearTimeout(timeoutId);
        console.warn('Camera failed:', err.message);
        let errorMsg = err.message || 'Unable to access camera.';
        if (errorMsg.includes('expected pattern') || errorMsg === 'The string did not match the expected pattern.') {
          errorMsg = 'This browser (Safari) blocks camera streams inside sandboxed preview frames. Please switch to "Upload from Album" instead.';
        }
        setError(errorMsg);
        if ((err.name && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) || 
            (err.message && err.message.toLowerCase().includes('denied'))) {
           setShowPermissionModal(true);
        }
      }
    }

    startCamera();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (activeStream) {
        activeStream.getTracks().forEach(track => {
          try { track.stop(); } catch (e){}
        });
      }
    };
  }, [scanTab]);

  useEffect(() => {
    if (scanTab === 'camera' && isReady && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [isReady, stream, scanTab]);

  // Read scans limit on mount
  useEffect(() => {
    async function loadScansCount() {
      try {
        const userId = auth.currentUser?.uid || '';
        const remaining = await getRemainingScans(userId);
        setRemainingScans(remaining);
      } catch (e) {
        console.warn('Could not read scan limit:', e);
      }
    }
    loadScansCount();
  }, []);

  const processImageFile = async (file: File) => {
    try {
      setIsScanning(true);
      setScanStatus("Uploading your receipt... ⏳");
      setScanError(null);
      setDetectedItems([]);
      const userId = auth.currentUser?.uid || '';
      const remaining = await getRemainingScans(userId);
      if (remaining <= 0) {
        throw new Error("You have reached your daily limit of 2 scans.");
      }

      let activeFile: Blob = file;
      const fileName = file.name ? file.name.toLowerCase() : '';
      let data: any;
      let usedMultipart = false;
      const endpoint = '/api/scan-receipt';

      // 1. Primary Attempt: Direct Multi-part Form Data Upload (extremely fast & native browser stream)
      try {
        setScanStatus("Parsing receipt lines with Gemini AI... ⏳");
        const formData = new FormData();
        formData.append('file', file, file.name);
        formData.append('language', language);

        const res = await fetch(endpoint, {
          method: 'POST',
          body: formData
        });

        if (res.ok) {
          data = await res.json();
          usedMultipart = true;
        } else {
          console.warn("Direct multipart form-data upload returned non-200, rolling back to base64 fallback...");
        }
      } catch (multipartErr) {
        console.warn("Direct multipart form-data upload failed, rolling back to base64 fallback:", multipartErr);
      }

      // 2. Secondary Fallback Attempt: Base64 JSON POST (bypass heic2any to prevent iOS DOMExceptions)
      if (!usedMultipart) {
        setScanStatus("Parsing receipt lines with Gemini AI... ⏳");
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read image file."));
          reader.readAsDataURL(activeFile);
        });

        const base64Data = dataUrl.split(',')[1];
        let mimeType = activeFile.type || 'image/jpeg';
        if (fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
          mimeType = 'image/heic';
        }
        
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageData: base64Data,
            mimeType: mimeType,
            language: language
          })
        });

        if (!res.ok) {
          const errJson = await res.json();
          throw new Error(errJson.error || "Failed to scan receipt.");
        }

        data = await res.json();
      }

      const newRemaining = await incrementScans(userId);
      setRemainingScans(newRemaining);

      if (data && data.success === false) {
        throw new Error(data.error || "Gracious fallback from backend.");
      }

      const actualData = (data && data.success === true && data.data) ? data.data : data;

      const storeName = actualData.storeName || "Unknown Store";
      const purchaseDate = actualData.date || format(new Date(), 'yyyy-MM-dd');

      if (actualData.items && Array.isArray(actualData.items)) {
        const items = actualData.items.map((item: any, idx: number) => {
          const upperName = typeof item.name === 'string' ? item.name.toUpperCase() : '';
          const matchedShelfKey = Object.keys(FOOD_SHELF_LIFE).find(k => upperName.includes(k)) || '';
          const shelfLife = FOOD_SHELF_LIFE[matchedShelfKey] || 7;
          
          let finalPrice = '';
          if (item.price !== undefined && item.price !== null) {
            let pStr = String(item.price).trim();
            let isNegative = pStr.includes('-');
            let cleanStr = '';
            for (let i = 0; i < pStr.length; i++) {
              const char = pStr[i];
              if ((char >= '0' && char <= '9') || char === '.') {
                cleanStr += char;
              }
            }
            let numParsed = parseFloat(cleanStr);
            if (!isNaN(numParsed)) {
              if (isNegative) numParsed = -numParsed;
              finalPrice = (numParsed < 0 ? '-' : '') + '$' + Math.abs(numParsed).toFixed(2);
            }
          }
          return {
            id: 'scanned-' + idx + '-' + Math.random().toString(36).substring(7),
            name: typeof item.name === 'string' ? item.name : 'Unknown Item',
            price: finalPrice || '$0.00',
            category: typeof item.category === 'string' ? item.category : 'Pantry',
            quantity: typeof item.quantity === 'string' ? item.quantity : '1',
            expiryDate: format(addDays(new Date(), shelfLife), 'yyyy-MM-dd'),
            storeName,
            purchaseDate
          };
        });

        if (items.length > 0) {
          setDetectedItems(items);
          setScanError(null);
        } else {
          setDetectedItems([]);
          setScanError("No valid ingredients detected on the receipt. Please try another snapshot.");
        }
      } else {
        setDetectedItems([]);
        setScanError("Could not parse items from the receipt. Please confirm the photo is clear.");
      }
    } catch (err: any) {
      console.warn("File selection/validation error:", err.message);
      setScanError(err.message || "Failed to parse receipt");
    } finally {
      setIsScanning(false);
      setScanStatus(null);
    }
  };

  const handleCameraCapture = async () => {
    if (!videoRef.current) return;
    try {
      setIsScanning(true);
      setScanStatus("Snapping picture... 📸");
      setScanError(null);
      setDetectedItems([]);
      const userId = auth.currentUser?.uid || '';
      const remaining = await getRemainingScans(userId);
      if (remaining <= 0) {
        throw new Error("You have reached your daily limit of 2 scans.");
      }
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not access photo canvas");
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      const base64Data = dataUrl.split(',')[1];
      
      setScanStatus("Parsing receipt lines with Gemini... ⏳");
      const endpoint = '/api/scan-receipt';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: base64Data,
          mimeType: 'image/jpeg',
          language: language
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to scan receipt.");
      }
      const data = await res.json();
      const newRemaining = await incrementScans(userId);
      setRemainingScans(newRemaining);

      if (data && data.success === false) {
        throw new Error(data.error || "Gracious fallback from backend.");
      }

      const actualData = (data && data.success === true && data.data) ? data.data : data;

      const storeName = actualData.storeName || "Unknown Store";
      const purchaseDate = actualData.date || format(new Date(), 'yyyy-MM-dd');

      if (actualData.items && Array.isArray(actualData.items)) {
        const items = actualData.items.map((item: any, idx: number) => {
          const upperName = typeof item.name === 'string' ? item.name.toUpperCase() : '';
          const matchedShelfKey = Object.keys(FOOD_SHELF_LIFE).find(k => upperName.includes(k)) || '';
          const shelfLife = FOOD_SHELF_LIFE[matchedShelfKey] || 7;
          
          let finalPrice = '';
          if (item.price !== undefined && item.price !== null) {
            let pStr = String(item.price).trim();
            let isNegative = pStr.includes('-');
            let cleanStr = '';
            for (let i = 0; i < pStr.length; i++) {
              const char = pStr[i];
              if ((char >= '0' && char <= '9') || char === '.') {
                cleanStr += char;
              }
            }
            let numParsed = parseFloat(cleanStr);
            if (!isNaN(numParsed)) {
              if (isNegative) numParsed = -numParsed;
              finalPrice = (numParsed < 0 ? '-' : '') + '$' + Math.abs(numParsed).toFixed(2);
            }
          }
          return {
            id: 'scanned-' + idx + '-' + Math.random().toString(36).substring(7),
            name: typeof item.name === 'string' ? item.name : 'Unknown Item',
            price: finalPrice || '$0.00',
            category: typeof item.category === 'string' ? item.category : 'Pantry',
            quantity: typeof item.quantity === 'string' ? item.quantity : '1',
            expiryDate: format(addDays(new Date(), shelfLife), 'yyyy-MM-dd'),
            storeName,
            purchaseDate
          };
        });
        
        if (items.length > 0) {
          setDetectedItems(items);
          setScanError(null);
        } else {
          setDetectedItems([]);
          setScanError("No valid ingredients detected. Please ensure the lens has sufficient lighting.");
        }
      } else {
        setDetectedItems([]);
        setScanError("Failed to parse items. Please retry.");
      }
    } catch (err: any) {
      console.warn("Camera capture error:", err.message);
      setScanError(err.message || "Failed to capture receipt");
    } finally {
      setIsScanning(false);
      setScanStatus(null);
    }
  };

  const handleFinish = () => {
    onItemsAdded(detectedItems.map(item => ({
      name: item.name,
      quantity: item.quantity,
      category: item.category,
      expiryDate: item.expiryDate,
      price: item.price,
      storeName: item.storeName,
      purchaseDate: item.purchaseDate
    })));
  };

  const triggerImagePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setIsScanning(true);
        setScanStatus("Uploading receipt photo... ⏳");
        await processImageFile(file);
      }
    } catch (err: any) {
      console.warn('File upload error caught in handler:', err.message || err);
      const errName = (err.name || '').toLowerCase();
      if ((errName === 'notallowederror' || errName === 'permissiondeniederror' || err.message.includes('denied'))) {
        setShowPermissionModal(true);
      } else {
        setScanError(err.message || 'Failed to upload file');
        alert("Upload failed: " + (err.message || "Connection error."));
      }
    } finally {
      setIsScanning(false);
      setScanStatus(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-0 bg-[#f4f4f0] overflow-hidden flex flex-col pt-safe px-4 sm:px-6 pb-6"
    >
      {/* Hidden native input with explicit id, fully unlinked from dark elements */}
      <input 
        type="file" 
        id="receipt-input"
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
        accept="image/*"
      />

      {/* Simulated Scanning Loader Overlay */}
      {isScanning && (
        <div className="absolute inset-0 z-[25] pointer-events-none flex items-center justify-center bg-[#FAF9F5]/40 backdrop-blur-xs">
          <div className="w-[80%] aspect-[3/4] relative flex flex-col items-center justify-center">
            {/* Brackets */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-[#18181b]/80 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-[#18181b]/80 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-[#18181b]/80 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-[#18181b]/80 rounded-br-lg" />

            {/* Scanning Laser Path Animation */}
            <motion.div 
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#1af] to-transparent shadow-[0_0_15px_rgba(26,170,255,0.6)]"
              animate={{ 
                top: ['5%', '95%', '5%'],
                opacity: [0.3, 0.9, 0.3]
              }}
              transition={{ 
                duration: 2.2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
            
            {/* Visual Spinner status card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/95 border border-zinc-200/50 p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3 backdrop-blur-md max-w-xs text-center"
            >
              <Loader2 className="w-8 h-8 text-[#18181b] animate-spin" />
              <span className="text-[#18181b] text-[11px] uppercase font-extrabold tracking-widest font-sans">
                {scanStatus || "Reading receipt lines..."}
              </span>
            </motion.div>
          </div>
        </div>
      )}

      {/* Main Container Layout */}
      <div className="relative z-20 flex-1 flex flex-col pt-12 pb-24 overflow-y-auto custom-scrollbar">
        <header className="mb-4 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onViewChange('inventory')}
              className="p-2.5 bg-white hover:bg-zinc-100 active:scale-95 text-[#18181b] shadow-sm rounded-full transition-all border border-zinc-200 cursor-pointer flex items-center justify-center shrink-0"
              title="Return"
              id="scanner-back-header-button"
            >
              <ArrowLeft className="w-4 h-4 text-[#18181b]" />
            </button>
            <div>
              <h2 className="text-3xl font-light tracking-tight text-[#18181b] mb-1">
                Scan Receipt
              </h2>
              <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">
                {isScanning ? 'AI reading with Gemini 2.5 Flash' : 'Instant Groceries Check'}
              </p>
            </div>
          </div>
          {detectedItems.length > 0 && (
            <button 
              onClick={() => {
                if (remainingScans <= 0) return;
                triggerImagePicker();
              }}
              disabled={isScanning || remainingScans <= 0}
              className="w-10 h-10 bg-white hover:bg-zinc-100 rounded-full flex items-center justify-center border border-zinc-200 shadow-sm transition-all disabled:opacity-30 cursor-pointer"
              title={remainingScans <= 0 ? 'Daily Limit Reached' : 'Upload another receipt photo'}
            >
              <Upload className="w-5 h-5 text-[#18181b]" />
            </button>
          )}
        </header>

        {scanError && (
          <div className="bg-red-500/10 border border-red-500/25 p-4 rounded-xl my-3 text-center">
            <p className="text-red-650 text-xs font-bold leading-relaxed">{scanError}</p>
          </div>
        )}

        {/* Daily limit counter */}
        <div className="self-start mb-4">
          <span className="px-3 py-1 bg-zinc-200/60 backdrop-blur-md rounded-full text-[9px] font-extrabold uppercase tracking-[0.14em] text-zinc-650 border border-zinc-300/40 shadow-sm">
            REMAINING SCANS: {remainingScans} TODAY
          </span>
        </div>

        {/* Unified switcher tab headers */}
        <div className="flex gap-2 p-1.5 bg-zinc-200/40 backdrop-blur-md rounded-2xl border border-zinc-300/20 mb-4 max-w-sm self-start shadow-sm">
          <button
            onClick={() => setScanTab('camera')}
            className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              scanTab === 'camera'
                ? 'bg-[#18181b] text-white shadow-md'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            {t('Scan Receipt')}
          </button>
          <button
            onClick={() => setScanTab('album')}
            className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              scanTab === 'album'
                ? 'bg-[#18181b] text-white shadow-md'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            {t('Upload from Albums')}
          </button>
        </div>

        {/* Conditional Viewfinder Layout -> Destroyed/Unmounted when album tab layout is active */}
        {scanTab === 'camera' ? (
          <div className="flex-1 min-h-[300px] flex flex-col mb-4 bg-white rounded-[32px] border border-zinc-200 shadow-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-zinc-50 flex items-center justify-center">
              {isReady ? (
                <video 
                  id="viewfinder"
                  ref={videoRef}
                  autoPlay 
                  playsInline 
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center space-y-4 px-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-white border border-zinc-100 shadow-sm flex items-center justify-center text-zinc-400">
                    <Camera className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[#18181b] text-sm font-semibold">
                      {error ? 'Camera Unavailable' : 'Initializing camera stream...'}
                    </p>
                    {error && (
                      <p className="text-zinc-500 text-xs leading-relaxed max-w-xs">
                        Permissions apply. Switch to the "Upload from Album" tab above to select photos directly.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Album Upload Tab View: Complete clean drop zone, camera element 100% unmounted from DOM */
          <div className="flex-1 min-h-[300px] flex flex-col mb-4 bg-white/50 rounded-[32px] border-2 border-dashed border-zinc-300 hover:border-zinc-400 transition-colors p-8 items-center justify-center text-center relative shadow-sm">
            <div className="w-20 h-20 rounded-full bg-white border border-zinc-200/50 shadow-sm flex items-center justify-center text-[#18181b] mb-4 hover:scale-105 transition-transform">
              <Upload className="w-8 h-8 text-[#18181b]" />
            </div>
            <div className="space-y-2 max-w-sm mb-6">
              <p className="text-[#18181b] text-base font-semibold">
                Choose Receipt Photo
              </p>
              <p className="text-zinc-500 text-xs leading-relaxed">
                Supports Standard Camera images, JPEGs, PNGs, and iOS album .HEIC files. Daily limit applies.
              </p>
            </div>
            <button 
              onClick={() => {
                if (remainingScans <= 0) return;
                triggerImagePicker();
              }}
              disabled={remainingScans <= 0 || isScanning}
              className="px-6 py-3 bg-[#18181b] hover:bg-zinc-800 text-white rounded-2xl text-xs font-bold uppercase tracking-widest active:scale-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              Choose receipt photo
            </button>
          </div>
        )}

        <div className="mt-auto space-y-4">
          {/* Detected Ingredients Mini List */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Recently Detected</span>
              <span className="px-2 py-0.5 bg-zinc-100 rounded-full text-[8px] font-bold text-zinc-500">
                {detectedItems.length} ITEMS
              </span>
            </div>
            
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
              {detectedItems.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => setEditingItem(item)}
                  className="flex justify-between items-center group cursor-pointer hover:bg-zinc-50 p-1.5 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <div className="flex flex-col">
                      <span className="text-[#18181b] text-xs font-semibold">{item.name}</span>
                      <span className="text-zinc-400 text-[8px] uppercase tracking-widest font-semibold mt-0.5">
                        Expires: {item.expiryDate} • {item.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-[8px] text-zinc-500 font-extrabold">{item.quantity}</span>
                    <span className="text-zinc-500 text-[10px] font-mono group-hover:text-[#18181b] transition-colors">{item.price}</span>
                  </div>
                </div>
              ))}
              
              {!isScanning && detectedItems.length > 0 && (
                <button 
                  onClick={() => onViewChange('add-item')}
                  className="w-full mt-3 py-4 border border-dashed border-zinc-300 rounded-xl flex items-center justify-center gap-2 text-zinc-500 hover:text-[#18181b] hover:border-zinc-400 hover:bg-zinc-50 transition-all font-sans cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em]">Add Manual Ingredient</span>
                </button>
              )}
            </div>
          </motion.div>

          <div className="flex gap-3 pt-2">
            {scanTab === 'camera' && isReady && !isScanning && detectedItems.length === 0 && (
              <button 
                onClick={handleCameraCapture}
                disabled={remainingScans <= 0}
                className="w-full bg-[#18181b] hover:bg-zinc-805 text-white py-4 rounded-2xl font-bold uppercase tracking-[0.14em] text-[10px] shadow-md transition-all disabled:opacity-45 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Camera className="w-4 h-4" />
                {remainingScans <= 0 ? 'Daily Limit Reached (2/2)' : 'Capture Receipt Photo'}
              </button>
            )}
            
            {detectedItems.length > 0 && (
              <button 
                onClick={handleFinish}
                disabled={isScanning || detectedItems.length === 0}
                className="flex-1 bg-[#1a7a40] text-white py-4.5 rounded-2xl font-bold uppercase tracking-[0.18em] text-[10px] hover:bg-green-700 shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Add To Inventory
              </button>
            )}
            
            <button 
              onClick={() => onViewChange('inventory')}
              className="w-16 bg-white border border-zinc-200 text-[#18181b] rounded-2xl flex items-center justify-center hover:bg-zinc-50 shadow-sm transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Item Modal */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-24">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!showCalendar) setEditingItem(null);
              }}
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-white rounded-[32px] overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-full mr-4">
                    <input 
                      type="text"
                      value={editingItem.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        setEditingItem({ ...editingItem, name: newName });
                        setDetectedItems(prev => prev.map(item => 
                          item.id === editingItem.id ? { ...item, name: newName } : item
                        ));
                      }}
                      className="text-2xl font-light text-zinc-900 mb-1 w-full bg-transparent border-b border-transparent hover:border-zinc-200 focus:border-black focus:outline-none transition-colors px-0 pb-1 font-sans"
                      placeholder="Product Name"
                    />
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Adjust details before adding</p>
                  </div>
                  <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-zinc-50 rounded-full shrink-0">
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>

                <div className="space-y-6 text-black">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-2 font-semibold">Quantity/Weight</label>
                      <input 
                        type="text"
                        value={editingItem.quantity}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingItem({ ...editingItem, quantity: val });
                          setDetectedItems(prev => prev.map(item => 
                            item.id === editingItem.id ? { ...item, quantity: val } : item
                          ));
                        }}
                        className="w-full h-12 bg-zinc-50 rounded-xl border border-zinc-150 px-4 text-zinc-900 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-2 font-semibold font-semibold">Price Estimate</label>
                      <input 
                        type="text"
                        value={editingItem.price}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingItem({ ...editingItem, price: val });
                          setDetectedItems(prev => prev.map(item => 
                            item.id === editingItem.id ? { ...item, price: val } : item
                          ));
                        }}
                        className="w-full h-12 bg-zinc-50 rounded-xl border border-zinc-150 px-4 text-zinc-900 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 font-semibold">Expiry Date</label>
                    <button 
                      onClick={() => setShowCalendar(true)}
                      className="w-full h-14 bg-zinc-50 rounded-2xl border border-zinc-150 px-6 flex items-center justify-between text-zinc-900 font-semibold"
                    >
                      <span className="text-sm">{editingItem.expiryDate}</span>
                      <CalendarIcon className="w-5 h-5 text-zinc-400" />
                    </button>
                  </div>

                  <button 
                    onClick={() => setEditingItem(null)}
                    className="w-full bg-[#18181b] hover:bg-black text-white py-4 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Nested Custom Calendar */}
              <AnimatePresence>
                {showCalendar && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-md">
                    <CustomCalendar 
                      selectedDate={editingItem.expiryDate}
                      onSelect={(date) => {
                        setDetectedItems(prev => prev.map(item => 
                          item.id === editingItem.id ? { ...item, expiryDate: date } : item
                        ));
                        setEditingItem({ ...editingItem, expiryDate: date });
                        setShowCalendar(false);
                      }}
                      onClose={() => setShowCalendar(false)}
                    />
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Permission Denied Fallback Modal */}
      <AnimatePresence>
        {showPermissionModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 bg-black/85 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-800 rounded-[28px] p-8 max-w-sm w-full text-center space-y-6 shadow-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-500">
                <Camera className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white tracking-tight">Access Denied</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Camera or storage access is disabled. Please reset your browser/app permissions in your device settings to scan receipts, or switch to "Upload from Album" to capture manually.
                </p>
              </div>
              <button
                onClick={() => setShowPermissionModal(false)}
                className="w-full bg-white hover:bg-zinc-100 text-black py-4.5 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] cursor-pointer transition-colors"
                id="close-permission-modal-btn"
              >
                Got It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
