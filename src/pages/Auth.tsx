import React from 'react';
import { motion } from 'motion/react';
import { LogIn } from 'lucide-react';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import KuraLogo from '../components/KuraLogo';

export default function Auth() {
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-24 h-24 bg-zinc-900 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-lg p-5">
          <KuraLogo className="w-full h-full text-white" strokeWidth={3} strokeColor="#ffffff" />
        </div>
        <h1 className="text-3xl font-bold text-ink-black mb-2 tracking-tight">Kura</h1>
        <p className="text-sm text-zinc-400 font-medium mb-12 max-w-[240px] mx-auto leading-relaxed">
          Mindful kitchen management for the modern home.
        </p>

        <button 
          onClick={handleGoogleSignIn}
          className="w-full py-5 bg-ink-black text-white rounded-[24px] font-bold text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl hover:bg-zinc-800 transition-all active:scale-95"
        >
          <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4 rounded-full" />
          Continue with Google
        </button>

        <p className="mt-8 text-[10px] text-zinc-300 font-bold uppercase tracking-[0.2em]">
          Zero Waste • Simple Living
        </p>
      </motion.div>
    </div>
  );
}
