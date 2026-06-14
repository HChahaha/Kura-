import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Clock, Plus, Trash2, Check, CheckCircle2, Search, ArrowRight, BookOpen, Smile, Info, Apple, Carrot, Beef, Fish, Wheat, Milk, Flame, Package, Home, Tags, Camera, Receipt, CheckSquare } from 'lucide-react';
import { InventoryItem, View, PurchaseRecord } from '../types';

interface InventoryProps {
  inventory: InventoryItem[];
  categories: string[];
  purchaseHistory?: PurchaseRecord[];
  onSelectItem: (id: string) => void;
  onViewChange: (view: View) => void;
  onUpdateInventory: (items: InventoryItem[]) => void;
  onAddPurchaseRecord?: (record: PurchaseRecord) => void;
  onConsumeItem?: (id: string) => void;
}

const getCategoryIcon = (category: string) => {
  const c = category.toLowerCase();
  if (c.includes('fruit')) return <Apple className="w-3 h-3" />;
  if (c.includes('veg')) return <Carrot className="w-3 h-3" />;
  if (c.includes('meat') || c.includes('beef') || c.includes('pork')) return <Beef className="w-3 h-3" />;
  if (c.includes('sea') || c.includes('fish')) return <Fish className="w-3 h-3" />;
  if (c.includes('grain') || c.includes('bread') || c.includes('baker')) return <Wheat className="w-3 h-3" />;
  if (c.includes('dairy') || c.includes('milk') || c.includes('egg')) return <Milk className="w-3 h-3" />;
  if (c.includes('frozen')) return <Flame className="w-3 h-3 text-cyan-500" />;
  if (c.includes('pantry')) return <Package className="w-3 h-3" />;
  if (c.includes('house') || c.includes('clean')) return <Home className="w-3 h-3" />;
  return <Tags className="w-3 h-3" />;
};

export default function Inventory({ 
  inventory, 
  categories, 
  purchaseHistory,
  onSelectItem, 
  onViewChange,
  onUpdateInventory,
  onAddPurchaseRecord,
  onConsumeItem
}: InventoryProps) {
  const [selectedCategory, setSelectedCategory] = useState('All Items');
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  
  const allCategories = ['All Items', ...categories];

  // Dynamic status-based message helper
  const expiringSoon = useMemo(() => {
    return inventory.filter(item => item.isExpiringSoon || (item.daysLeft !== undefined && item.daysLeft <= 3));
  }, [inventory]);

  const freshItems = useMemo(() => {
    return inventory.filter(item => !item.isExpiringSoon && (item.daysLeft === undefined || item.daysLeft > 3));
  }, [inventory]);

  // Combined search & category filter
  const filteredInventory = useMemo(() => {
    let result = inventory;
    
    if (selectedCategory !== 'All Items') {
      result = result.filter(item => item.category === selectedCategory);
    }
    
    if (inventorySearchQuery.trim()) {
      result = result.filter(item => 
        item.name.toLowerCase().includes(inventorySearchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(inventorySearchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(inventorySearchQuery.toLowerCase())
      );
    }
    
    return result;
  }, [inventory, selectedCategory, inventorySearchQuery]);

  // Separate categorized list for filtered ingredients (excluding the expiring ones since they have their own high-priority shelf at the top)
  const byCategory = useMemo(() => {
    return filteredInventory.reduce((acc, item) => {
      // If performing search or specific category, show all filtered items. Otherwise group non-expiring by category
      const shouldGroupAll = inventorySearchQuery.trim() !== '' || selectedCategory !== 'All Items';
      
      if (shouldGroupAll || !item.isExpiringSoon) {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
      }
      return acc;
    }, {} as Record<string, typeof inventory>);
  }, [filteredInventory, selectedCategory, inventorySearchQuery]);

  // Handle marking item as consumed (deleting)
  const handleConsume = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 1. Instant Frontend State Update: immediately filter out the consumed item so it vanishes
    onUpdateInventory(inventory.filter(item => item.id !== id));
    
    // 2. Trigger To-Buy List Automation & Backend Mutation via Parent Callback
    if (onConsumeItem) {
      onConsumeItem(id);
    }
  };

  // Expiry notification summary
  const getExpirySummaryMessage = () => {
    if (expiringSoon.length === 0) {
      return {
        text: "Pristine status. Everything is fresh & healthy!",
        color: "text-bamboo-green",
        bg: "bg-bamboo-green/5 border-bamboo-green/10"
      };
    } else if (expiringSoon.length <= 2) {
      return {
        text: `Friendly reminder: ${expiringSoon.length} item${expiringSoon.length > 1 ? 's' : ''} close to expiration. Let's incorporate them soon!`,
        color: "text-orange-600",
        bg: "bg-amber-500/5 border-amber-500/10"
      };
    } else {
      return {
        text: `Urgent: ${expiringSoon.length} ingredients require your immediate attention to prevent food waste!`,
        color: "text-red-600",
        bg: "bg-sunset-orange/5 border-sunset-orange/10"
      };
    }
  };

  const summary = getExpirySummaryMessage();

  // Color coordinate day status badge
  const getDayLabel = (days: number | undefined) => {
    if (days === undefined) return null;
    if (days <= 0) {
      return { text: "⏰ Overdue!", badgeClass: "bg-red-500/10 text-red-700 border-red-200" };
    }
    if (days === 1) {
      return { text: "⚠️ Expires tomorrow!", badgeClass: "bg-red-500/10 text-red-600 border-red-200" };
    }
    if (days === 2) {
      return { text: "🕒 2 days left", badgeClass: "bg-amber-500/10 text-amber-600 border-amber-200" };
    }
    if (days === 3) {
      return { text: "🕒 3 days left", badgeClass: "bg-amber-500/10 text-amber-600 border-amber-200" };
    }
    return { text: `${days} days left`, badgeClass: "bg-zinc-100 text-zinc-500 border-zinc-200/50" };
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="pb-32 px-6 pt-24 max-w-lg mx-auto font-sans"
    >
      <header className="mb-8 flex flex-col gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 block mb-1">Your Kitchen Shelf</span>
          <h2 className="text-4xl font-light tracking-tight text-ink-black select-none">My Inventory</h2>
          <p className="text-zinc-400 text-xs font-medium mt-1">
            Tracking {inventory.length} ingredients to coordinate meals dynamically.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
          <input 
            type="text"
            placeholder="Search pantry, fridge..."
            value={inventorySearchQuery}
            onChange={(e) => setInventorySearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-xs focus:outline-none focus:border-zinc-300 transition-colors"
          />
        </div>
      </header>

      {/* Eat First Banner Alarm */}
      <section 
        onClick={() => onViewChange('recipes')}
        className={`mb-10 p-5 rounded-[16px] border ${summary.bg} flex items-start gap-4 transition-all duration-250 cursor-pointer hover:shadow-sm hover:scale-[1.01] active:scale-[0.98] select-none group`}
      >
        <div className="w-8 h-8 rounded-full bg-white border border-zinc-100 flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105">
          {expiringSoon.length > 2 ? (
            <AlertTriangle className="w-4 h-4 text-orange-600 animate-pulse" />
          ) : (
            <Info className="w-4 h-4 text-zinc-400" />
          )}
        </div>
        <div className="flex-1">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-0.5 group-hover:text-zinc-500 transition-colors">Freshness & Expiration Alert</h4>
          <p className={`text-xs font-semibold ${summary.color} leading-relaxed flex items-center gap-1.5`}>
            <span>{summary.text}</span>
          </p>
        </div>
      </section>

      {/* Main Expiring Section (The absolute top priority: to remind the user what they need to eat first) */}
      {expiringSoon.length > 0 && !inventorySearchQuery && selectedCategory === 'All Items' && (
        <section className="mb-12">
          <div className="flex items-center gap-2.5 mb-5">
             <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
             <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">
               ⏰ Eat Me First! (Urgent Items)
             </h3>
          </div>

          <div className="space-y-3">
            {expiringSoon.map((item) => {
              const dayBadge = getDayLabel(item.daysLeft);
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectItem(item.id)}
                  className="p-4 bg-white hover:bg-zinc-50/50 border border-zinc-100 rounded-[18px] flex items-center gap-4 transition-all cursor-pointer group shadow-sm hover:shadow"
                >
                  <div className="w-14 h-14 rounded-[12px] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 relative text-amber-500">
                    <div className="scale-125 shrink-0">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="absolute -top-1 -left-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white dark:border-zinc-950 shadow-sm" />
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-2">
                    <h4 className="font-bold text-ink-black text-base tracking-tight break-words leading-tight">{item.name}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="px-2 py-0.5 rounded-[6px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold whitespace-nowrap shrink-0">
                        {item.quantity}
                      </span>
                      <span className="px-2 py-0.5 rounded-[6px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0">
                        {item.location}
                      </span>
                      {dayBadge && (
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-widest border shrink-0 whitespace-nowrap ${dayBadge.badgeClass}`}>
                          {dayBadge.text}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    
                    {/* Quick Consumed Button */}
                    <button
                      onClick={(e) => handleConsume(item.id, e)}
                      title="Mark as consumed"
                      className="p-2 rounded-full hover:bg-bamboo-green/10 text-zinc-300 hover:text-bamboo-green transition-all"
                    >
                      <CheckCircle2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Category Chips Selection */}
      <nav className="flex gap-3 overflow-x-auto no-scrollbar mb-12 py-2">
        {allCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`flex items-center gap-1.5 px-5 py-3 rounded-xl border transition-all shadow-sm ${
              selectedCategory === cat 
                ? 'bg-ink-black text-white border-ink-black shadow-md' 
                : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 hover:shadow'
            }`}
          >
            {selectedCategory === cat && <CheckCircle2 className="w-3.5 h-3.5" />}
            {selectedCategory !== cat && getCategoryIcon(cat)}
            <span className="text-[11px] font-bold uppercase tracking-widest whitespace-nowrap">{cat}</span>
          </button>
        ))}
      </nav>

      {/* Ingredients Catalog List */}
      <section id="tour-inventory-cards" className="space-y-14">
        {Object.keys(byCategory).length === 0 ? (
          <div className="py-16 text-center bg-zinc-50/50 rounded-3xl border border-dashed border-zinc-200">
            <p className="text-zinc-500 text-sm font-medium">
              {inventorySearchQuery ? 'No ingredients matched your search.' : 'Your inventory is currently empty. Use the button below to add items.'}
            </p>
          </div>
        ) : (
          Object.entries(byCategory).map(([category, rawItems]) => {
            const items = rawItems as InventoryItem[];
            return (
              <div key={category} className="animate-in fade-in duration-500 bg-zinc-50/30 rounded-3xl p-5 border border-zinc-100">
                <div className="flex items-center gap-2 mb-5 pl-2">
                  <div className="w-8 h-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center shadow-sm text-zinc-500">
                    {getCategoryIcon(category)}
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-ink-black/70">
                    {category} <span className="text-zinc-400 font-medium tracking-normal ml-1 border pl-2 bg-white rounded-md px-1">{items.length}</span>
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {items.map((item) => {
                    const isExpiring = item.isExpiringSoon || (item.daysLeft !== undefined && item.daysLeft <= 3);
                    const dayBadge = getDayLabel(item.daysLeft);
                    
                    return (
                      <div
                        key={item.id}
                        onClick={() => onSelectItem(item.id)}
                        className={`p-4 bg-white border ${isExpiring ? 'border-amber-400 dark:border-amber-500/50' : 'border-zinc-100 dark:border-zinc-800'} rounded-[16px] flex items-center gap-4 hover:bg-zinc-50/50 transition-colors cursor-pointer group shadow-sm`}
                      >
                        <div className={`w-12 h-12 rounded-[10px] ${isExpiring ? 'bg-amber-500/10 border-amber-300 text-amber-500' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'} border flex items-center justify-center shrink-0 relative`}>
                          <div className="scale-110 shrink-0">
                            {getCategoryIcon(item.category)}
                          </div>
                          {isExpiring && <div className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-amber-500" />}
                        </div>
                        
                        <div className="flex-1 min-w-0 pr-1">
                          <h4 className="font-bold text-ink-black text-base leading-tight break-words mb-1">{item.name}</h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded-[6px] bg-zinc-150 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold whitespace-nowrap shrink-0">{item.quantity}</span>
                            <span className="px-2 py-0.5 rounded-[6px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0">{item.location}</span>
                            {dayBadge && (
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-widest text-center shrink-0 whitespace-nowrap ${
                                isExpiring ? 'bg-amber-500/15 text-amber-700 border border-amber-200' : 'bg-zinc-100 text-zinc-400 border border-zinc-200/50'
                              }`}>
                                {item.daysLeft !== undefined ? `${item.daysLeft} days` : 'Fresh'}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => handleConsume(item.id, e)}
                            title="Consume ingredient"
                            className="p-1 px-2 rounded hover:bg-bamboo-green/5 text-zinc-300 hover:text-bamboo-green transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Manual Entry Button */}
      <section className="mt-14 space-y-4">
        <button 
          onClick={() => onViewChange('add-item')}
          className="w-full py-8 border border-dashed border-zinc-200 rounded-[20px] flex items-center justify-center gap-2.5 text-zinc-400 hover:text-ink-black hover:border-zinc-400 transition-all font-sans group"
        >
          <div className="w-7 h-7 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300 group-hover:bg-ink-black group-hover:text-white transition-all">
             <Plus className="w-4.5 h-4.5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.2em]">Add Fresh Ingredient</span>
        </button>
      </section>
    </motion.div>
  );
}
