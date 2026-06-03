import React, { useState } from 'react';
import { LayoutGrid, BookOpen, Settings, Camera, Plus, ReceiptText, ShoppingBag, Bell, Calendar, ShoppingCart, CheckCircle2, Home, ChefHat, Archive } from 'lucide-react';
import { View, InventoryItem, ShoppingItem } from '../types';

interface NavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
  inventory?: InventoryItem[];
  shoppingList?: ShoppingItem[];
}

export function TopBar({ currentView, onViewChange, inventory = [], shoppingList = [] }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  if (currentView === 'scanner' || currentView === 'auth') return null;

  const expiringItems = inventory.filter(i => i.daysLeft !== undefined && i.daysLeft <= 3);
  const uncheckedShopping = shoppingList.filter(s => !s.checked);
  
  const alertCount = expiringItems.length + (uncheckedShopping.length > 0 ? 1 : 0);

  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100 flex items-center justify-between px-6 h-16">
      <div className="flex items-center gap-2">
        <span className="font-bold text-lg tracking-tight text-ink-black cursor-pointer" onClick={() => onViewChange('inventory')}>
          KURA
        </span>
      </div>
      
      <div className="flex items-center gap-2 relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2 text-zinc-400 hover:text-ink-black transition-all relative rounded-full ${isOpen ? 'bg-zinc-50 text-ink-black' : ''}`}
          title="Kitchen Reminders"
        >
          <Bell className="w-5 h-5" />
          {alertCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
          )}
        </button>

        <button 
          className="p-2 text-zinc-400 hover:text-ink-black transition-colors" 
          onClick={() => onViewChange('scanner')}
          title="Scan Receipt"
        >
          <Camera className="w-5 h-5" />
        </button>

        <button 
          className="w-8 h-8 rounded-full bg-ink-black flex items-center justify-center hover:opacity-80 transition-all active:scale-95"
          onClick={() => onViewChange('add-item')}
        >
          <Plus className="w-4 h-4 text-white" />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 top-12 w-72 bg-white rounded-2xl shadow-2xl border border-zinc-100 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-50">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400">Kitchen Alerts</span>
                <span className="bg-amber-50 text-amber-600 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  {alertCount} Reminders
                </span>
              </div>

              <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                {expiringItems.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-amber-600 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Expiring Soon
                    </span>
                    <div className="space-y-1 pl-4">
                      {expiringItems.slice(0, 4).map(item => (
                        <div key={item.id} className="flex justify-between items-center text-[11px] text-zinc-650">
                          <span className="font-semibold truncate max-w-[130px]">{item.name}</span>
                          <span className={`text-[8px] font-bold uppercase tracking-wider px-1 py-0.2 rounded ${
                            item.daysLeft !== undefined && item.daysLeft <= 1 
                              ? 'bg-red-50 text-red-600' 
                              : 'bg-amber-50 text-amber-600'
                          }`}>
                            {item.daysLeft === 0 ? 'Today' : item.daysLeft === 1 ? '1 day' : `${item.daysLeft} days`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-zinc-400 py-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-bamboo-green shrink-0" />
                    <span className="text-[10px] font-light italic">All inventory ingredients are fresh.</span>
                  </div>
                )}

                {uncheckedShopping.length > 0 ? (
                  <div className="space-y-1.5 pt-3 border-t border-zinc-50">
                    <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-zinc-400 flex items-center gap-1">
                      <ShoppingCart className="w-3 h-3" /> To Buy List
                    </span>
                    <div className="pl-4 flex items-center justify-between text-[11px] text-zinc-650">
                      <span>{uncheckedShopping.length} items to purchase</span>
                      <button 
                        onClick={() => {
                          onViewChange('shopping');
                          setIsOpen(false);
                        }}
                        className="text-bamboo-green hover:underline text-[9px] font-semibold tracking-wider uppercase"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 pt-3 border-t border-zinc-50">
                    <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-zinc-400 flex items-center gap-1">
                      <ShoppingCart className="w-3 h-3" /> To Buy List
                    </span>
                    <p className="text-[10px] text-zinc-400 font-light italic pl-4">Shopping list is fully clear.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

export function BottomNav({ currentView, onViewChange }: NavigationProps) {
  if (currentView === 'auth') return null;
  const navItems = [
    { id: 'inventory', label: 'Inventory', icon: Archive },
    { id: 'shopping', label: 'To Buy', icon: ShoppingCart },
    { id: 'recipes', label: 'Recipes', icon: ChefHat },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const isScanner = currentView === 'scanner';

  return (
    <nav className={`fixed bottom-0 left-0 w-full z-50 transition-colors duration-500 ${
      isScanner 
        ? 'bg-black/20 backdrop-blur-md border-t border-white/10' 
        : 'bg-white/70 backdrop-blur-xl border-t border-zinc-100'
    } h-20 pb-safe`}>
      <div className="flex justify-around items-center h-full max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as View)}
              className={`flex flex-col items-center justify-center gap-1 transition-all ${
                isScanner 
                  ? (isActive ? 'text-white' : 'text-white/40 hover:text-white/60')
                  : (isActive ? 'text-ink-black' : 'text-zinc-400 hover:text-zinc-600')
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[9px] font-bold uppercase tracking-widest leading-none">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
