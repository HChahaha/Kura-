import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, CheckCircle2, Plus, X, Calendar as CalendarIcon, Upload, Loader2 } from 'lucide-react';
import { View } from '../types';
import { FOOD_SHELF_LIFE } from '../constants';
import { CustomCalendar } from '../components/CustomCalendar';
import { addDays, format } from 'date-fns';
import { getRemainingScans, incrementScans } from '../lib/limits';
import { auth } from '../lib/firebase';

interface ScannerProps {
  onViewChange: (view: View) => void;
  onItemsAdded: (items: any[]) => void;
}

interface DetectedItem {
  id: string;
  name: string;
  price: string;
  category: string;
  quantity: string;
  expiryDate: string;
  storeName: string;
  purchaseDate: string;
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
  const [remainingScans, setRemainingScans] = useState<number>(3);

  // Load remaining scans on mount
  useEffect(() => {
    async function loadLimits() {
      const userId = auth.currentUser?.uid || '';
      const remaining = await getRemainingScans(userId);
      setRemainingScans(remaining);
    }
    loadLimits();
  }, []);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    async function startCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera API not supported in this browser context. Try uploading standard image instead.");
        }
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }, 
          audio: false 
        });
        activeStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setIsReady(true);
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        setError(err.message || "Unable to access camera. Use the upload button below.");
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await processImageFile(file);
    }
  };

  const processImageFile = async (file: File) => {
    try {
      setIsScanning(true);
      setScanError(null);
      setDetectedItems([]);

      const userId = auth.currentUser?.uid || '';
      const remaining = await getRemainingScans(userId);
      if (remaining <= 0) {
        throw new Error("You have reached your daily limit of 3 receipt scans.");
      }

      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: base64Data,
          mimeType: file.type
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to scan receipt image.");
      }

      const data = await res.json();
      const newRemaining = await incrementScans(userId);
      setRemainingScans(newRemaining);

      const storeName = data.storeName || "T&T Supermarket";
      const purchaseDate = data.date || format(new Date(), 'yyyy-MM-dd');

      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        const items = data.items.map((item: any, idx: number) => {
          const shelfLife = FOOD_SHELF_LIFE[item.name] || 7;
          return {
            id: `scanned-${idx}-${Math.random().toString(36).substring(7)}`,
            name: item.name || 'Generic Item',
            price: item.price ? `$${parseFloat(item.price).toFixed(2)}` : '$1.99',
            category: item.category || 'Pantry',
            quantity: item.quantity || '1 unit',
            expiryDate: format(addDays(new Date(), shelfLife), 'yyyy-MM-dd'),
            storeName,
            purchaseDate
          };
        });
        setDetectedItems(items);
        setScanError(null);
      } else {
        throw new Error("Could not detect any valid grocery item lines in receipt. Try another photo.");
      }
    } catch (err: any) {
      console.error(err);
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
        throw new Error("You have reached your daily limit of 3 receipt scans.");
      }

      // Draw video frame to temporary canvas
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

      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        const items = data.items.map((item: any, idx: number) => {
          const shelfLife = FOOD_SHELF_LIFE[item.name] || 7;
          return {
            id: `scanned-${idx}-${Math.random().toString(36).substring(7)}`,
            name: item.name || 'Generic Item',
            price: item.price ? `$${parseFloat(item.price).toFixed(2)}` : '$1.99',
            category: item.category || 'Pantry',
            quantity: item.quantity || '1 unit',
            expiryDate: format(addDays(new Date(), shelfLife), 'yyyy-MM-dd'),
            storeName,
            purchaseDate
          };
        });
        setDetectedItems(items);
        setScanError(null);
      } else {
        throw new Error("Could not parse items. Please make sure food items & prices are visible.");
      }
    } catch (err: any) {
      console.error(err);
      setScanError(err.message || "Failed to capture receipt");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-0 bg-black overflow-hidden flex flex-col"
    >
      {/* Live Camera Backdrop */}
      <div className="absolute inset-0 z-0">
        {isReady ? (
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            muted
            className="w-full h-full object-cover opacity-80"
          />
        ) : (
          <div className="w-full h-full bg-zinc-900 flex items-center justify-center p-12 text-center text-ink-black h-screen">
            <div className="space-y-4">
              <Camera className="w-12 h-12 text-white/20 mx-auto" />
              <p className="text-white/40 text-sm font-medium">{error || 'Initializing camera stream...'}</p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={remainingScans <= 0 || isScanning}
                className="mx-auto flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl border border-white/10 transition-all text-xs uppercase tracking-widest font-bold disabled:opacity-40"
              >
                <Upload className="w-4 h-4" />
                Upload Receipt
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept="image/*"
              />
              <p className="text-white/30 text-[10px] uppercase font-bold tracking-widest block pt-2">
                Remaining scans: {remainingScans} today
              </p>
            </div>
          </div>
        )}
        {/* Dark overlay for readability of UI elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />
      </div>

      {/* Simulated OCR Scanner Overlay */}
      {isScanning && (
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center bg-black/40">
          <div className="w-[80%] aspect-[3/4] relative">
            {/* Brackets */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white/80 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white/80 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white/80 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white/80 rounded-br-lg" />

            {/* Scanning Line */}
            <motion.div 
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent shadow-[0_0_15px_rgba(255,255,255,0.5)]"
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
                <Loader2 className="w-6 h-6 text-white animate-spin" />
                <span className="text-white text-[10px] uppercase font-bold tracking-widest font-sans">Reading receipt lines...</span>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* UI Controls Layer */}
      <div className="relative z-20 flex-1 flex flex-col pt-20 px-6">
        <header className="mb-6 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-light tracking-tight text-white mb-1 shadow-sm">Scan Receipt</h2>
            <p className="text-white/60 text-xs font-medium uppercase tracking-widest">
              {isScanning ? 'AI reading with Gemini 2.5 Flash' : 'Items Detected'}
            </p>
          </div>
          {(!isReady || detectedItems.length > 0) && (
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning || remainingScans <= 0}
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/10 disabled:opacity-30"
              title="Upload another receipt photo"
            >
              <Upload className="w-5 h-5 text-white" />
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
          <span className="px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[9px] font-extrabold uppercase tracking-widest text-zinc-300 border border-white/5">
            Remaining scans today: {remainingScans} today
          </span>
        </div>

        <div className="mt-auto mb-32 space-y-4">
          {/* Extracted Mini List */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Recently Detected</span>
              <span className="px-2 py-0.5 bg-white/10 rounded-full text-[8px] font-bold text-white/80">
                {detectedItems.length} ITEMS
              </span>
            </div>
            
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
              {detectedItems.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => setEditingItem(item)}
                  className="flex justify-between items-center group cursor-pointer hover:bg-white/5 p-1 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <div className="flex flex-col">
                      <span className="text-white text-xs font-medium">{item.name}</span>
                      <span className="text-white/40 text-[8px] uppercase tracking-widest">
                        Expires: {item.expiryDate} ({item.category})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-white/5 px-1.5 py-0.5 rounded text-[8px] text-zinc-400">{item.quantity}</span>
                    <span className="text-white/40 text-[10px] group-hover:text-white transition-colors">{item.price}</span>
                  </div>
                </div>
              ))}
              
              {!isScanning && detectedItems.length > 0 && (
                <button 
                  onClick={() => onViewChange('add-item')}
                  className="w-full mt-4 py-6 border border-dashed border-white/20 rounded-2xl flex items-center justify-center gap-2 text-white/40 hover:text-white hover:border-white/40 transition-all font-sans"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Add Manual Ingredient</span>
                </button>
              )}

              {isScanning && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" />
                    <span className="text-white/80 text-xs font-medium italic">Analyzing next...</span>
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
                className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-2xl font-bold uppercase tracking-[0.1em] text-[10px] transition-all border border-white/20 mb-3 disabled:opacity-45"
              >
                Scan Receipt
              </button>
            )}
            <button 
              onClick={handleFinish}
              disabled={isScanning || detectedItems.length === 0}
              className="flex-1 bg-white text-black py-4 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-zinc-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Add To Inventory
            </button>
            <button 
              onClick={() => onViewChange('inventory')}
              className="w-16 bg-black/40 backdrop-blur-md border border-white/10 text-white rounded-2xl flex items-center justify-center hover:bg-black/60 transition-all"
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
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
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
    </motion.div>
  );
}
