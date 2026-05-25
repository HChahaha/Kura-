import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, User, Bell, Shield, LogOut, ChevronRight, Globe, Moon, Check, Upload, Camera } from 'lucide-react';
import { View } from '../types';
import { auth } from '../lib/firebase';
import { signOut, updateProfile } from 'firebase/auth';

interface SettingsProps {
  onViewChange: (view: View) => void;
  user: any;
}

type Section = 'main' | 'profile' | 'notifications' | 'privacy' | 'appearance';

export default function Settings({ onViewChange, user }: SettingsProps) {
  const [activeSection, setActiveSection] = useState<Section>('main');

  // Profile State
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Settings State
  const [notifications, setNotifications] = useState({
    meals: true,
    expiry: true,
    marketing: false
  });

  const [privacy, setPrivacy] = useState({
    analytics: true,
    dataSharing: false
  });

  // Dark Mode State
  const [appearance, setAppearance] = useState(() => {
    return document.documentElement.classList.contains('dark') ? 'Dark Mode' : 'Light Mode';
  });

  const appearances = ['Light Mode', 'Dark Mode'];

  const toggleAppearance = (app: string) => {
    setAppearance(app);
    if (app === 'Dark Mode') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onViewChange('inventory');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setIsUpdatingProfile(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName,
        photoURL
      });
      setActiveSection('main');
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const menuItems = [
    { id: 'profile', icon: User, label: 'Profile Settings', sub: 'Edit your name and avatar' },
    { id: 'notifications', icon: Bell, label: 'Notifications', sub: 'Meal reminders and expiry alerts' },
    { id: 'privacy', icon: Shield, label: 'Privacy & Security', sub: 'Manage your data' },
    { id: 'appearance', icon: Moon, label: 'Appearance', sub: appearance },
  ];

  return (
    <div className="pb-32 pt-24 max-w-lg mx-auto font-sans px-6 overflow-hidden">
      <AnimatePresence mode="wait">
        {activeSection === 'main' && (
          <motion.div 
            key="main"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <header className="mb-8">
              <h1 className="text-4xl font-light mb-6 tracking-tight">Settings</h1>
            </header>

            {/* User Info */}
            <div className="p-6 bg-zinc-50/50 border-[0.5px] border-zinc-100 rounded-3xl mb-8 flex items-center gap-4">
              <div className="w-16 h-16 shrink-0 rounded-full bg-white border border-zinc-100 flex items-center justify-center text-2xl overflow-hidden shadow-sm">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  '🌸'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-ink-black truncate">{user?.displayName || 'User'}</h3>
                <p className="text-xs text-zinc-400 font-medium truncate">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-2 mb-8">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div 
                    key={item.id}
                    className="w-full p-4 bg-white border-[0.5px] border-zinc-100 rounded-2xl flex items-center justify-between hover:border-zinc-200 transition-colors group cursor-pointer"
                    onClick={() => setActiveSection(item.id as Section)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:text-ink-black transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-left flex-1 mr-4 min-w-0">
                        <p className="text-sm font-bold text-ink-black leading-tight truncate">{item.label}</p>
                        <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider block font-sans truncate mt-1">{item.sub}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-300" />
                  </div>
                );
              })}
            </div>

            <button 
              onClick={handleSignOut}
              className="w-full py-5 rounded-[24px] bg-red-50 text-red-500 font-bold text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>

            <div className="mt-12 text-center">
              <p className="text-[10px] text-zinc-300 font-bold uppercase tracking-[0.3em]">Kura v2.0.0</p>
            </div>
          </motion.div>
        )}

        {/* PROFILE SECTION */}
        {activeSection === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <header className="mb-8 flex items-center gap-4">
              <button 
                onClick={() => setActiveSection('main')}
                className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-500 hover:text-ink-black transition-colors border border-zinc-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-light tracking-tight">Profile Settings</h1>
            </header>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="flex flex-col items-center mb-8">
                <div className="relative w-24 h-24 rounded-full bg-zinc-50 border-[0.5px] border-zinc-200 flex items-center justify-center text-3xl overflow-hidden shadow-sm group">
                  {photoURL ? (
                    <img src={photoURL} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    '🌸'
                  )}
                  <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Camera className="w-6 h-6 text-white" />
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setPhotoURL(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                </div>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-4">Tap to Change Avatar</p>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 pl-1">Display Name</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-white border border-zinc-100 rounded-[16px] px-5 py-4 text-sm font-medium text-ink-black placeholder:text-zinc-200 focus:ring-1 focus:ring-ink-black/5 focus:border-ink-black transition-all shadow-sm"
                />
              </div>
              <div className="pt-6">
                <button 
                  type="submit" 
                  disabled={isUpdatingProfile}
                  className="w-full bg-ink-black text-white py-4 rounded-[16px] font-bold uppercase tracking-[0.2em] text-[10px] hover:opacity-80 transition-all disabled:opacity-50"
                >
                  {isUpdatingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* NOTIFICATIONS SECTION */}
        {activeSection === 'notifications' && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <header className="mb-8 flex items-center gap-4">
              <button 
                onClick={() => setActiveSection('main')}
                className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-500 hover:text-ink-black transition-colors border border-zinc-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-light tracking-tight">Notifications</h1>
            </header>

            <div className="space-y-4">
              <ToggleRow 
                label="Meal Reminders" 
                sub="Get reminded to track your meals"
                enabled={notifications.meals} 
                onToggle={() => setNotifications(prev => ({ ...prev, meals: !prev.meals }))} 
              />
              <ToggleRow 
                label="Expiry Alerts" 
                sub="Notify when food is about to expire"
                enabled={notifications.expiry} 
                onToggle={() => setNotifications(prev => ({ ...prev, expiry: !prev.expiry }))} 
              />
              <ToggleRow 
                label="Marketing Updates" 
                sub="Occasional news and feature updates"
                enabled={notifications.marketing} 
                onToggle={() => setNotifications(prev => ({ ...prev, marketing: !prev.marketing }))} 
              />
            </div>
          </motion.div>
        )}

        {/* PRIVACY SECTION */}
        {activeSection === 'privacy' && (
          <motion.div
            key="privacy"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <header className="mb-8 flex items-center gap-4">
              <button 
                onClick={() => setActiveSection('main')}
                className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-500 hover:text-ink-black transition-colors border border-zinc-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-light tracking-tight">Privacy & Security</h1>
            </header>

            <div className="space-y-4">
              <ToggleRow 
                label="App Analytics" 
                sub="Share anonymous usage data to improve the app"
                enabled={privacy.analytics} 
                onToggle={() => setPrivacy(prev => ({ ...prev, analytics: !prev.analytics }))} 
              />
              <ToggleRow 
                label="Data Sharing" 
                sub="Allow sharing data with partner integrations"
                enabled={privacy.dataSharing} 
                onToggle={() => setPrivacy(prev => ({ ...prev, dataSharing: !prev.dataSharing }))} 
              />
            </div>
            
            <div className="mt-12 pt-8 border-t border-zinc-100">
               <button className="w-full py-4 bg-white border border-red-100 text-red-500 rounded-[16px] font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-red-50 transition-colors">
                  Delete Account
               </button>
            </div>
          </motion.div>
        )}

        {/* APPEARANCE SECTION */}
        {activeSection === 'appearance' && (
          <motion.div
            key="appearance"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <header className="mb-8 flex items-center gap-4">
              <button 
                onClick={() => setActiveSection('main')}
                className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-500 hover:text-ink-black transition-colors border border-zinc-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-light tracking-tight">Appearance</h1>
            </header>

            <div className="space-y-2">
              {appearances.map(app => (
                <div 
                  key={app}
                  onClick={() => toggleAppearance(app)}
                  className="w-full p-5 bg-white border-[0.5px] border-zinc-100 rounded-2xl flex items-center justify-between hover:border-zinc-200 transition-colors cursor-pointer"
                >
                  <span className="font-medium text-ink-black">{app}</span>
                  {appearance === app && <Check className="w-5 h-5 text-bamboo-green" />}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToggleRow({ label, sub, enabled, onToggle }: { label: string; sub: string; enabled: boolean; onToggle: () => void }) {
  return (
    <div className="w-full p-5 bg-white border-[0.5px] border-zinc-100 rounded-2xl flex items-center justify-between">
      <div className="flex-1 mr-4">
        <p className="text-sm font-bold text-ink-black">{label}</p>
        <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider block font-sans mt-1">{sub}</p>
      </div>
      <button 
        onClick={onToggle}
        className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${enabled ? 'bg-ink-black' : 'bg-zinc-200'}`}
      >
        <motion.div 
          className="w-4 h-4 rounded-full bg-white absolute top-1"
          animate={{ left: enabled ? '28px' : '4px' }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}
