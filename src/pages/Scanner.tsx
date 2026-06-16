import React, { useState, useEffect, useRef } from 'react';
import { Camera, ArrowLeft, Loader2, CheckCircle2, X, Plus, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays } from 'date-fns';
import { getRemainingScans, incrementScans } from '../lib/limits';
import { auth } from '../lib/firebase';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [editingItem, setEditingItem] = useState<DetectedItem | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [remainingScans, setRemainingScans] = useState<number>(2);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  useEffect(() => {
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
      } catch (err: any) {
        if (timeoutId) clearTimeout(timeoutId);
        console.warn('Camera failed:', err.message);
        setError(err.message || 'Unable to access camera.');
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
          try { track.stop(); } catch(e){}
        });
      }
    };
  }, []);

  useEffect(() => {
    if (isReady && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [isReady, stream]);

  const processImageFile = async (file: File) => {
    try {
      setIsScanning(true);
      setScanError(null);
      setDetectedItems([]);
      const userId = auth.currentUser?.uid || '';
      const remaining = await getRemainingScans(userId);
      if (remaining <= 0) {
        throw new Error("You have reached your daily limit of 2 receipt scans.");
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const base64Data = dataUrl.split(',')[1];
        
        const res = await fetch('/api/scan-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageData: base64Data,
            mimeType: file.type || 'image/jpeg'
          })
        });

        if (!res.ok) {
          const errJson = await res.json();
          throw new Error(errJson.error || "Failed to scan receipt image.");
        }

        const data = await res.json();
        const newRemaining = await incrementScans(userId);
        setRemainingScans(newRemaining);
        const storeName = data.storeName || "Vancouver Merchant";
        const purchaseDate = data.date || format(new Date(), 'yyyy-MM-dd');

        // [MY PATCH FOR PARSING HERE]
        if (data.items && Array.isArray(data.items)) {
          const items = data.items.map((item: any, idx: number) => {
            const shelfLife = typeof item.name === 'string' ? (FOOD_SHELF_LIFE[item.name] || 7) : 7;
            let finalPrice = '';
            if (item.price !== undefined && item.price !== null) {
              let pStr = String(item.price).trim();
              let isNegative = pStr.includes('-');
              pStr = pStr.replace(/[^0-9.]/g, '');
              let numParsed = parseFloat(pStr);
              if (!isNaN(numParsed)) {
                if (isNegative) numParsed = -numParsed;
                finalPrice = (numParsed < 0 ? '-' : '') + '$' + Math.abs(numParsed).toFixed(2);
              }
            }
            return {
              id: 'scanned-' + idx + '-' + Math.random().toString(36).substring(7),
              name: typeof item.name === 'string' ? item.name : 'Unknown Item',
              price: finalPrice,
              category: typeof item.category === 'string' ? item.category : 'Pantry',
              quantity: typeof item.quantity === 'string' ? item.quantity : '1',
              expiryDate: format(addDays(new Date(), shelfLife), 'yyyy-MM-dd'),
              storeName,
              purchaseDate
            };
          }).filter((i: any) => i.name !== 'Unknown Item');
          if (items.length > 0) {
            setDetectedItems(items);
            setScanError(null);
          } else {
            setDetectedItems([]);
            setScanError(null);
          }
        } else {
          setDetectedItems([]);
          setScanError(null);
        }
      };
    } catch (err: any) {
      console.warn("File selection/validation error:", err.message);
      setScanError(err.message || "Unable to read receipt");
    } finally {
      setIsScanning(false);
    }
  };

  const handleCameraCapture = async () => {
    if (!videoRef.current) return;
    try {
      setIsScanning(true);
      setScanError(null);
      setDetectedItems([]);
      const userId = auth.currentUser?.uid || '';
      const remaining = await getRemainingScans(userId);
      if (remaining <= 0) {
        throw new Error("You have reached your daily limit of 2 receipt scans.");
      }
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not access photo canvas");
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      const base64Data = dataUrl.split(',')[1];
      
      const res = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: base64Data,
          mimeType: 'image/jpeg'
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to scan camera snapshot.");
      }
      const data = await res.json();
      const newRemaining = await incrementScans(userId);
      setRemainingScans(newRemaining);
      const storeName = data.storeName || "Vancouver Merchant";
      const purchaseDate = data.date || format(new Date(), 'yyyy-MM-dd');

      if (data.items && Array.isArray(data.items)) {
        const items = data.items.map((item: any, idx: number) => {
          const shelfLife = typeof item.name === 'string' ? (FOOD_SHELF_LIFE[item.name] || 7) : 7;
          let finalPrice = '';
          if (item.price !== undefined && item.price !== null) {
            let pStr = String(item.price).trim();
            let isNegative = pStr.includes('-');
            pStr = pStr.replace(/[^0-9.]/g, '');
            let numParsed = parseFloat(pStr);
            if (!isNaN(numParsed)) {
              if (isNegative) numParsed = -numParsed;
              finalPrice = (numParsed < 0 ? '-' : '') + '$' + Math.abs(numParsed).toFixed(2);
            }
          }
          return {
            id: 'scanned-' + idx + '-' + Math.random().toString(36).substring(7),
            name: typeof item.name === 'string' ? item.name : 'Unknown Item',
            price: finalPrice,
            category: typeof item.category === 'string' ? item.category : 'Pantry',
            quantity: typeof item.quantity === 'string' ? item.quantity : '1',
            expiryDate: format(addDays(new Date(), shelfLife), 'yyyy-MM-dd'),
            storeName,
            purchaseDate
          };
        }).filter((i: any) => i.name !== 'Unknown Item');
        
        if (items.length > 0) {
          setDetectedItems(items);
          setScanError(null);
        } else {
          setDetectedItems([]);
          setScanError(null);
        }
      } else {
        setDetectedItems([]);
        setScanError(null);
      }
    } catch (err: any) {
      console.warn("Camera capture error:", err.message);
      setScanError(err.message || "Failed to capture receipt");
    } finally {
      setIsScanning(false);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        await processImageFile(file);
      }
    } catch (err: any) {
      console.warn('File upload error caught in handler:', err.message || err);
      const errName = (err.name || '').toLowerCase();
      if ((errName === 'notallowederror' || errName === 'permissiondeniederror' || err.message.includes('denied'))) {
        setShowPermissionModal(true);
      } else {
        setScanError(err.message || 'Failed to upload file');
      }
    }
  };
  return (
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 className="fixed inset-0 z-0 bg-[#f4f4f0] overflow-hidden flex flex-col pt-safe px-4 sm:px-6 pb-6"
 >
  {/* Always-mounted hidden input for receipt camera or manual uploads with direct capture on mobile */}
  <input 
    type="file" 
    ref={fileInputRef} 
    onChange={handleFileUpload} 
    className="hidden" 
    accept="image/*"
  />



 {/* Simulated OCR Scanner Overlay */}
 {isScanning && (
 <div className="absolute inset-0 z-[25] pointer-events-none flex items-center justify-center">
 <div className="w-[80%] aspect-[3/4] relative">
 {/* Brackets */}
 <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-[#18181b]/80 rounded-tl-lg" />
 <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-[#18181b]/80 rounded-tr-lg" />
 <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-[#18181b]/80 rounded-bl-lg" />
 <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-[#18181b]/80 rounded-br-lg" />

 {/* Scanning Line */}
 <motion.div 
 className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#18181b]/40 to-transparent shadow-[0_0_15px_rgba(24,24,27,0.3)]"
 animate={{ 
 top: ['5%', '95%', '5%'],
 opacity: [0.3, 0.8, 0.3]
 }}
 transition={{ 
 duration: 3, 
 repeat: Infinity, 
 ease: "easeInOut" 
 }}
 />
 
 {/* OCR 'Active Reading' brackets simulation */}
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: [0, 0.4, 0] }}
 transition={{ duration: 2, repeat: Infinity, times: [0, 0.5, 1] }}
 className="absolute inset-0 border-[40px] border-black/20 flex items-center justify-center"
 >
 <div className="flex flex-col items-center gap-2">
 <Loader2 className="w-6 h-6 text-[#18181b] animate-spin" />
 <span className="text-[#18181b] text-[10px] uppercase font-bold tracking-widest font-sans">Reading receipt lines...</span>
 </div>
 </motion.div>
 </div>
 </div>
 )}

 {/* UI Controls Layer */}
 <div className="relative z-20 flex-1 flex flex-col pt-12">
 <header className="mb-6 flex justify-between items-start">
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
 <h2 className="text-3xl font-light tracking-tight text-[#18181b] mb-1">Scan Receipt</h2>
 <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">
 {isScanning ? 'AI reading with Gemini 2.5 Flash' : 'Items Detected'}
 </p>
 </div>
 </div>
 {(!isReady || detectedItems.length > 0) && (
 <button 
 onClick={() => {
 try {
 fileInputRef.current?.click();
 } catch (err: any) {
 console.warn("Header upload click failed:", err.message || err);
 setShowPermissionModal(true);
 }
 }}
 disabled={isScanning || remainingScans <= 0}
 className="w-10 h-10 bg-white hover:bg-zinc-100 rounded-full flex items-center justify-center border border-zinc-200 shadow-sm transition-all disabled:opacity-30"
 title={remainingScans <= 0 ? 'Daily Limit Reached' : 'Upload another receipt photo'}
 >
 <Upload className="w-5 h-5 text-[#18181b]" />
 </button>
 )}
 </header>

 {scanError && (
 <div className="bg-red-500/10 border border-red-500/25 p-4 rounded-xl my-4 text-center">
 <p className="text-red-400 text-xs font-semibold">{scanError}</p>
 </div>
 )}

 {/* Remaining counts pill */}
 <div className="self-start mb-4">
 <span className="px-3.5 py-1.5 bg-zinc-200/60 backdrop-blur-md rounded-full text-[9px] font-extrabold uppercase tracking-[0.15em] text-zinc-600 border border-zinc-300/50 shadow-sm">
 REMAINING SCANS: {remainingScans} TODAY
 </span>
 </div>

    {/* Unified Viewfinder layout */}
  <div className="flex-1 flex flex-col mb-4 bg-white rounded-[32px] border border-zinc-200 shadow-sm overflow-hidden relative min-h-[300px]">
    {/* Inside camera section */}
    <div className="absolute inset-0 bg-zinc-100 flex items-center justify-center">
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
          <div className="w-16 h-16 rounded-full bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-400">
            <Camera className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <p className="text-[#18181b] text-sm font-semibold">
              {error ? 'Camera Restricted' : 'Initializing stream...'}
            </p>
            {error && (
              <p className="text-zinc-500 text-xs leading-relaxed max-w-xs">
                Browser restrictions apply. Use the gallery upload button below instead.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
  
  {/* Choose from Albums / Upload action */}
  {!isScanning && detectedItems.length === 0 && (
    <button 
      onClick={() => {
        try { fileInputRef.current?.click(); } 
        catch (err) { setShowPermissionModal(true); }
      }}
      disabled={remainingScans <= 0}
      className="mb-8 w-full py-4 rounded-2xl border-2 border-dashed border-zinc-300 bg-white hover:bg-zinc-50 hover:border-zinc-400 transition-all flex flex-col items-center justify-center gap-2 group disabled:opacity-50"
    >
      <div className="bg-zinc-100 text-[#18181b] p-3 rounded-full group-hover:scale-110 transition-transform">
        <Upload className="w-5 h-5" />
      </div>
      <span className="text-[#18181b] text-xs font-bold uppercase tracking-widest">Choose from Albums 🖼️</span>
    </button>
  )}



 <div className="mt-auto space-y-4">
 {/* Extracted Mini List */}
 <motion.div 
 initial={{ y: 20, opacity: 0 }}
 animate={{ y: 0, opacity: 1 }}
 transition={{ delay: 0.1 }}
 className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm"
 >
 <div className="flex justify-between items-center mb-3">
 <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Recently Detected</span>
 <span className="px-2 py-0.5 bg-zinc-100 rounded-full text-[8px] font-bold text-zinc-600">
 {detectedItems.length} ITEMS
 </span>
 </div>
 
 <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
 {detectedItems.map((item) => (
 <div 
 key={item.id} 
 onClick={() => setEditingItem(item)}
 className="flex justify-between items-center group cursor-pointer hover:bg-zinc-50 p-1 rounded-lg transition-colors"
 >
 <div className="flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
 <div className="flex flex-col">
 <span className="text-[#18181b] text-xs font-medium">{item.name}</span>
 <span className="text-zinc-500 text-[8px] uppercase tracking-widest">
 Expires: {item.expiryDate} ({item.category})
 </span>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-[8px] text-zinc-500">{item.quantity}</span>
 <span className="text-zinc-500 text-[10px] group-hover:text-[#18181b] transition-colors">{item.price}</span>
 </div>
 </div>
 ))}
 
 {!isScanning && detectedItems.length > 0 && (
 <button 
 onClick={() => onViewChange('add-item')}
 className="w-full mt-4 py-6 border border-dashed border-zinc-300 rounded-2xl flex items-center justify-center gap-2 text-zinc-500 hover:text-[#18181b] hover:border-zinc-400 hover:bg-zinc-50 transition-all font-sans"
 >
 <Plus className="w-4 h-4" />
 <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Add Manual Ingredient</span>
 </button>
 )}

 {isScanning && (
 <div className="flex justify-between items-center">
 <div className="flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-pulse" />
 <span className="text-zinc-500 text-xs font-medium italic">Analyzing next...</span>
 </div>
 </div>
 )}
 </div>
 </motion.div>

 <div className="flex gap-3 mt-4">
 {isReady && !isScanning && detectedItems.length === 0 && (
 <button 
 onClick={handleCameraCapture}
 disabled={remainingScans <= 0}
 className="w-full bg-zinc-100 hover:bg-zinc-200 text-[#18181b] py-3 rounded-2xl font-bold uppercase tracking-[0.1em] text-[10px] transition-all border border-zinc-200 mb-3 disabled:opacity-45"
 >
 {remainingScans <= 0 ? 'Daily Limit Reached (2/2)' : 'Scan Receipt'}
 </button>
 )}
 <button 
 onClick={handleFinish}
 disabled={isScanning || detectedItems.length === 0}
 className="flex-1 bg-[#18181b] text-white py-4 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-zinc-800 shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2"
 >
 <CheckCircle2 className="w-4 h-4" />
 Add To Inventory
 </button>
 <button 
 onClick={() => onViewChange('inventory')}
 className="w-16 bg-white border border-zinc-200 text-[#18181b] rounded-2xl flex items-center justify-center hover:bg-zinc-50 shadow-sm transition-all"
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
 className="text-2xl font-light text-ink-black mb-1 w-full bg-transparent border-b border-transparent hover:border-zinc-200 focus:border-ink-black focus:outline-none transition-colors px-0 pb-1 font-sans"
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
 <label className="block text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Quantity/Weight</label>
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
 className="w-full h-12 bg-zinc-50 rounded-xl border border-zinc-100 px-4 text-ink-black text-xs font-semibold focus:outline-none"
 />
 </div>
 <div>
 <label className="block text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Price Estimate</label>
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
 className="w-full h-12 bg-zinc-50 rounded-xl border border-zinc-100 px-4 text-ink-black text-xs font-semibold focus:outline-none"
 />
 </div>
 </div>

 <div>
 <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 font-semibold">Expiry Date</label>
 <button 
 onClick={() => setShowCalendar(true)}
 className="w-full h-14 bg-zinc-50 rounded-2xl border border-zinc-100 px-6 flex items-center justify-between text-ink-black font-semibold"
 >
 <span className="text-sm">{editingItem.expiryDate}</span>
 <CalendarIcon className="w-5 h-5 text-zinc-400" />
 </button>
 </div>

 <button 
 onClick={() => setEditingItem(null)}
 className="w-full bg-ink-black text-white py-4 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px]"
 >
 Save Changes
 </button>
 </div>
 </div>

 {/* Nested Calendar */}
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
 Camera or storage access is denied. Please reset your browser/app permissions in your device settings to upload receipts.
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
