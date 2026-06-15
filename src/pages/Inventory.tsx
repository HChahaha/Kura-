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
 onConsumeItem?: (id: string, addToBuyList: boolean) => void;
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
 const [consumedItemToPrompt, setConsumedItemToPrompt] = useState<{id: string, name: string} | null>(null);
 
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
 const handleConsume = (id: string, name: string, e: React.MouseEvent) => {
 e.stopPropagation();
 
 // 1. Instant Frontend State Update: immediately filter out the consumed item so it vanishes
 onUpdateInventory(inventory.filter(item => item.id !== id));
 
 // 2. Open confirmation prompt
 setConsumedItemToPrompt({ id, name });
 };

 const confirmConsumeToBuy = (addToBuyList: boolean) => {
 if (consumedItemToPrompt && onConsumeItem) {
 onConsumeItem(consumedItemToPrompt.id, addToBuyList);
 }
 setConsumedItemToPrompt(null);
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
 <span className="text-[11px] font-medium text-zinc-500 block mb-1">Your kitchen shelf</span>
 <h2 className="text-4xl font-semibold tracking-tight text-ink-black select-none">My Inventory</h2>
 <p className="text-zinc-500 text-sm mt-1">
 {inventory.length} items in stock
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
 className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-forest-green focus:ring-1 focus:ring-forest-green transition-colors"
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
 <AlertTriangle className="w-4 h-4 text-terracotta animate-pulse" />
 ) : (
 <Info className="w-4 h-4 text-forest-green" />
 )}
 </div>
 <div className="flex-1">
 <h4 className="text-[11px] font-semibold text-zinc-500 mb-0.5 group-hover:text-zinc-600 transition-colors">Freshness alert</h4>
 <p className={`text-sm font-medium ${summary.color} leading-relaxed flex items-center gap-1.5`}>
 <span style={{ borderColor: '#313a31', borderStyle: 'solid', color: '#6d856d' }}>{summary.text}</span>
 </p>
 </div>
 </section>

 {/* Main Expiring Section (The absolute top priority: to remind the user what they need to eat first) */}
 {expiringSoon.length > 0 && !inventorySearchQuery && selectedCategory === 'All Items' && (
 <section className="mb-12">
 <div className="flex items-center gap-2.5 mb-5 pl-2">
 <span className="w-2 h-2 rounded-full bg-terracotta animate-pulse" />
 <h3 className="text-xs font-semibold text-zinc-600">
 Eat me first (Urgent items)
 </h3>
 </div>

 <div className="space-y-3">
 {expiringSoon.map((item) => {
 const dayBadge = getDayLabel(item.daysLeft);
 return (
 <div
 key={item.id}
 onClick={() => onSelectItem(item.id)}
 className="p-4 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center gap-4 transition-all cursor-pointer group shadow-sm hover:shadow"
 >
 <div className="w-14 h-14 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 relative text-terracotta">
 <div className="scale-125 shrink-0">
 {getCategoryIcon(item.category)}
 </div>
 <div className="absolute -top-1 -left-1 w-3.5 h-3.5 rounded-full bg-terracotta border-2 border-white shadow-sm" />
 </div>
 
 <div className="flex-1 min-w-0 pr-2">
 <h4 className="font-semibold text-ink-black text-base tracking-tight break-words leading-tight">{item.name}</h4>
 <div className="flex flex-wrap items-center gap-2 mt-1.5">
 <span className="px-2.5 py-1 rounded-full bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-medium whitespace-nowrap shrink-0">
 {item.quantity}
 </span>
 <span className="px-2.5 py-1 rounded-full bg-zinc-50 border border-zinc-200 text-zinc-500 text-xs font-medium whitespace-nowrap shrink-0">
 {item.location}
 </span>
 {dayBadge && (
 <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide border shrink-0 whitespace-nowrap ${dayBadge.badgeClass}`}>
 {dayBadge.text}
 </span>
 )}
 </div>
 </div>

 <div className="flex items-center gap-1 shrink-0">
 
 {/* Quick Consumed Button */}
 <button
 onClick={(e) => handleConsume(item.id, item.name, e)}
 title="Mark as consumed"
 className="p-2 rounded-full hover:bg-forest-tint/50 text-zinc-300 hover:text-forest-green transition-all"
 >
 <CheckCircle2 className="w-5 h-5" />
 </button>
 </div>
 </div>
 );
 })}
 </div>
 </section>
 )}

 {/* Category Chips Selection */}
 <nav className="flex gap-2.5 overflow-x-auto no-scrollbar mb-12 py-2">

 {allCategories.map((cat) => (
 <button
 key={cat}
 onClick={() => setSelectedCategory(cat)}
 className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all ${
 selectedCategory === cat 
 ? 'bg-forest-green text-white border-forest-green shadow-md' 
 : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 shadow-sm'
 }`}
 >
 {selectedCategory === cat && <CheckCircle2 className="w-4 h-4" />}
 {selectedCategory !== cat && getCategoryIcon(cat)}
 <span className="text-[13px] font-medium whitespace-nowrap">{cat === 'All Items' ? 'All items' : cat}</span>
 </button>
 ))}
 </nav>

 {/* Ingredients Catalog List */}
 <section id="tour-inventory-cards" className="space-y-10">
 {Object.keys(byCategory).length === 0 ? (
 <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-zinc-300 shadow-sm">
 <p className="text-zinc-500 text-sm font-medium">
 {inventorySearchQuery ? 'No ingredients matched your search.' : 'Nothing in the fridge yet...'}
 </p>
 </div>
 ) : (
 Object.entries(byCategory).map(([category, rawItems]) => {
 const items = rawItems as InventoryItem[];
 return (
 <div key={category} className="animate-in fade-in duration-500">
 <div className="flex items-center gap-2 mb-4 pl-2">
 <div className="w-8 h-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center shadow-sm text-zinc-500">
 {getCategoryIcon(category)}
 </div>
 <h3 className="text-sm font-semibold text-ink-black/80">
 {category} <span className="text-zinc-500 font-medium ml-1.5 px-2 py-0.5 bg-zinc-100 rounded-full text-xs">{items.length}</span>
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
 className={`p-4 bg-white border ${isExpiring ? 'border-orange-200' : 'border-zinc-200'} rounded-[20px] flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group shadow-sm`}
 >
 <div className={`w-12 h-12 rounded-[14px] ${isExpiring ? 'bg-orange-50 border-orange-200 text-terracotta' : 'bg-zinc-50 border-zinc-200 text-zinc-600'} border flex items-center justify-center shrink-0 relative`}>
 <div className="scale-110 shrink-0">
 {getCategoryIcon(item.category)}
 </div>
 {isExpiring && <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-terracotta shadow-sm border-2 border-white" />}
 </div>
 
 <div className="flex-1 min-w-0 pr-1">
 <h4 className="font-semibold text-ink-black text-base leading-tight break-words mb-1.5">{item.name}</h4>
 <div className="flex flex-wrap items-center gap-2">
 <span className="px-2.5 py-1 rounded-full bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-medium whitespace-nowrap shrink-0">{item.quantity}</span>
 <span className="px-2.5 py-1 rounded-full bg-zinc-50 border border-zinc-200 text-zinc-500 text-xs font-medium whitespace-nowrap shrink-0">{item.location}</span>
 {dayBadge && (
 <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wide text-center shrink-0 whitespace-nowrap ${
 isExpiring ? 'bg-orange-50 text-terracotta border-orange-200' : 'bg-white text-zinc-500 border border-zinc-200'
 }`}>
 {item.daysLeft !== undefined ? `${item.daysLeft} days` : 'Fresh'}
 </span>
 )}
 </div>
 </div>

 <div className="flex items-center gap-1 shrink-0">
 <button
 onClick={(e) => handleConsume(item.id, item.name, e)}
 title="Consume ingredient"
 className="p-2 rounded-full text-zinc-300 hover:text-forest-green hover:bg-forest-tint/50 transition-all opacity-0 group-hover:opacity-100"
 >
 <Check className="w-5 h-5" />
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
 <section className="mt-10 space-y-4">
 <button 
 onClick={() => onViewChange('add-item')}
 className="w-full py-6 bg-white shadow-sm border border-zinc-200 rounded-[20px] flex items-center justify-center gap-3 text-zinc-500 hover:text-ink-black hover:border-forest-green hover:shadow-md transition-all font-sans group"
 >
 <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-forest-green group-hover:text-white transition-all shadow-sm">
 <Plus className="w-5 h-5" />
 </div>
 <span className="text-sm font-semibold">Add fresh ingredient</span>
 </button>
 </section>

 {/* Item Consumed Context Modal/Toast */}
 <AnimatePresence>
 {consumedItemToPrompt && (
 <motion.div 
 initial={{ opacity: 0, y: 50, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 50, scale: 0.95 }}
 className="fixed bottom-24 left-4 right-4 z-50 flex justify-center pointer-events-none"
 >
 <div className="bg-ink-black text-white p-5 rounded-2xl shadow-2xl pointer-events-auto max-w-sm w-full border border-zinc-700/50">
 <div className="flex items-start gap-4">
 <div className="w-10 h-10 rounded-full bg-forest-green/20 flex flex-shrink-0 items-center justify-center border border-forest-green/30 text-forest-green">
 <CheckCircle2 className="w-5 h-5" />
 </div>
 <div className="flex-1">
 <h4 className="font-semibold text-sm text-white mb-1">Item consumed!</h4>
 <p className="text-xs text-zinc-400 leading-relaxed">
 Would you like to add <strong>{consumedItemToPrompt.name}</strong> back to your To-Buy List?
 </p>
 <div className="flex gap-2 mt-4">
 <button 
 onClick={() => confirmConsumeToBuy(false)}
 className="flex-1 py-2 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
 >
 No
 </button>
 <button 
 onClick={() => confirmConsumeToBuy(true)}
 className="flex-1 py-2 rounded-xl text-xs font-semibold bg-forest-green text-white hover:bg-green-600 transition-colors shadow-sm"
 >
 Yes, add to list
 </button>
 </div>
 </div>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </motion.div>
 );
}
