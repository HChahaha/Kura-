import React, { useState, useEffect, useRef } from 'react';
import { Camera, ArrowLeft, Loader2, CheckCircle2, X, Plus, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays } from 'date-fns';
import { getRemainingScans, incrementScans } from '../lib/firebase';
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

export function Scanner({ onViewChange, onItemsAdded }: ScannerProps) {
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
