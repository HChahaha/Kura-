import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, RefreshCw, CheckCircle2, ChevronRight, ShoppingBag, Plus, X, Calendar as CalendarIcon, Upload } from 'lucide-react';
import { View } from '../types';
import { FOOD_SHELF_LIFE } from '../constants';
import { CustomCalendar } from '../components/CustomCalendar';
import { addDays, format } from 'date-fns';

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
}

export default function Scanner({ onViewChange, onItemsAdded }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [isScanning, setIsScanning] = useState(true);
  const [editingItem, setEditingItem] = useState<DetectedItem | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    async function startCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera API not supported in this browser context. Try opening in a new tab.");
        }
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }, 
          audio: false 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setIsReady(true);
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.message.includes('Permission denied')) {
           setError("Camera permission denied. Please allow access or open the app in a new tab.");
        } else {
           setError(err.message || "Unable to access camera. Use the upload button below.");
        }
      }
    }

    startCamera();

    // Initial simulation of detection
    const timer = setTimeout(() => {
      const initialItems = [
        { id: 'd1', name: 'Organic Milk', price: '$4.50', category: 'Dairy & Eggs', quantity: '1.0L', expiryDate: '' },
        { id: 'd2', name: 'Baby Spinach', price: '$3.25', category: 'Vegetables', quantity: '200g', expiryDate: '' },
        { id: 'd3', name: 'Salmon Fillet', price: '$12.00', category: 'Meat & Seafood', quantity: '350g', expiryDate: '' },
        { id: 'd4', name: 'Eggs', price: '$5.50', category: 'Dairy & Eggs', quantity: '12 qty', expiryDate: '' }
      ].map(item => {
        const shelfLife = FOOD_SHELF_LIFE[item.name] || 7;
        return {
          ...item,
          expiryDate: format(addDays(new Date(), shelfLife), 'yyyy-MM-dd')
        };
      });
      setDetectedItems(initialItems);
      setIsScanning(false);
    }, 4500);

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      clearTimeout(timer);
    };
  }, []);

  const handleFinish = () => {
    onItemsAdded(detectedItems.map(item => ({
      name: item.name,
      quantity: item.quantity,
      category: item.category,
      expiryDate: item.expiryDate
    })));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Simulate "processing" the uploaded image
      setIsScanning(true);
      setTimeout(() => {
        setIsScanning(false);
        // Maybe add some more items or just keep the simulated ones
      }, 2000);
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
          <div className="w-full h-full bg-zinc-900 flex items-center justify-center p-12 text-center">
            <div className="space-y-4">
              <Camera className="w-12 h-12 text-white/20 mx-auto" />
              <p className="text-white/40 text-sm font-medium">{error || 'Initializing camera...'}</p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="mx-auto flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl border border-white/10 transition-all text-xs uppercase tracking-widest font-bold"
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
            </div>
          </div>
        )}
        {/* Dark overlay for readability of UI elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />
      </div>

      {/* Simulated OCR Scanner Overlay */}
      {isScanning && (
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
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
              className="absolute inset-0 border-[40px] border-black/20"
            />
          </div>
        </div>
      )}

      {/* UI Controls Layer */}
      <div className="relative z-20 flex-1 flex flex-col pt-20 px-6">
        <header className="mb-6 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-light tracking-tight text-white mb-1 shadow-sm">Scan Receipt</h2>
            <p className="text-white/60 text-xs font-medium uppercase tracking-widest">
              {isScanning ? 'Processing in shadow-mode' : 'Items Detected'}
            </p>
          </div>
          {!isReady && (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/10"
            >
              <Upload className="w-5 h-5 text-white" />
            </button>
          )}
        </header>

        <div className="mt-auto mb-32 space-y-4">
          {/* Extracted Mini List */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
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
                      <span className="text-white/40 text-[8px] uppercase tracking-widest">Expires: {item.expiryDate}</span>
                    </div>
                  </div>
                  <span className="text-white/40 text-[10px] group-hover:text-white transition-colors">{item.price}</span>
                </div>
              ))}
              
              {!isScanning && (
                <button 
                  onClick={() => onViewChange('add-item')}
                  className="w-full mt-4 py-6 border border-dashed border-white/20 rounded-2xl flex items-center justify-center gap-2 text-white/40 hover:text-white hover:border-white/40 transition-all font-sans"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Add Ingredient</span>
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

          <div className="flex gap-3">
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
                  <div>
                    <h3 className="text-2xl font-light text-ink-black mb-1">{editingItem.name}</h3>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Adjust details before adding</p>
                  </div>
                  <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-zinc-50 rounded-full">
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Expiry Date</label>
                    <button 
                      onClick={() => setShowCalendar(true)}
                      className="w-full h-14 bg-zinc-50 rounded-2xl border border-zinc-100 px-6 flex items-center justify-between text-ink-black font-semibold"
                    >
                      <span>{editingItem.expiryDate}</span>
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
