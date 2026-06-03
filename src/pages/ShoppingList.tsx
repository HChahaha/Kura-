import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Search, Plus, Trash2, Calendar, Store, DollarSign, Archive, CheckCircle2, Circle, AlertCircle, ArrowUpRight, ChevronDown, Tag, Apple, Carrot, Beef, Fish, Wheat, Milk, Flame, Package, Home, Tags } from 'lucide-react';
import { ShoppingItem, PurchaseRecord, View, InventoryItem } from '../types';
import { getNormalShelfLife, suggestCategory } from '../lib/imageUtils';

interface ShoppingListProps {
  shoppingList: ShoppingItem[];
  purchaseHistory: PurchaseRecord[];
  categories: string[];
  onAddShoppingItem: (item: ShoppingItem) => void;
  onUpdateShoppingItem: (id: string, updates: Partial<ShoppingItem>) => void;
  onDeleteShoppingItem: (id: string) => void;
  onAddPurchaseRecord: (record: PurchaseRecord) => void;
  onUpdatePurchaseRecord?: (id: string, updates: Partial<PurchaseRecord>) => void;
  onDeletePurchaseRecord?: (id: string) => void;
  onAddToInventory: (item: Omit<InventoryItem, 'id' | 'daysLeft' | 'isExpiringSoon'>) => void;
  onViewChange: (view: View) => void;
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

const UNITS = ['g', 'kg', 'lbs', 'ml', 'l', 'pcs', 'packs', 'cups', 'spoons', 'cans', 'bottles', 'bags', 'boxes'];

const WEEKLY_FLYER_DEALS = [
  { id: 'f1', storeName: 'T&T Supermarket', name: 'Pork Ribs', price: '$2.99/lb', category: 'Meat' },
  { id: 'f2', storeName: 'T&T Supermarket', name: 'Napa Cabbage', price: '$0.99/lb', category: 'Vegetables' },
  { id: 'f3', storeName: 'Costco', name: 'Toilet Paper', price: '$19.99', category: 'Household' },
  { id: 'f4', storeName: 'Walmart', name: '2% Milk (4L)', price: '$5.49', category: 'Dairy' },
  { id: 'f5', storeName: 'Loblaws', name: 'Avocados (Bag)', price: '$3.99', category: 'Vegetables' },
  { id: 'f6', storeName: 'FreshCo', name: 'Chicken Breast', price: '$4.99/lb', category: 'Meat' },
];

export default function ShoppingList({
  shoppingList,
  purchaseHistory,
  categories,
  onAddShoppingItem,
  onUpdateShoppingItem,
  onDeleteShoppingItem,
  onAddPurchaseRecord,
  onUpdatePurchaseRecord,
  onDeletePurchaseRecord,
  onAddToInventory,
  onViewChange
}: ShoppingListProps) {
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newStoreName, setNewStoreName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Pantry');
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');
  
  // Custom purchase details state
  const [activeCompletingItem, setActiveCompletingItem] = useState<ShoppingItem | null>(null);
  const [editingHistoryItem, setEditingHistoryItem] = useState<PurchaseRecord | null>(null);
  const [storeName, setStoreName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [price, setPrice] = useState('');
  const [quantityBought, setQuantityBought] = useState('1');
  const [unitBought, setUnitBought] = useState('pcs');
  const [isUnitOpen, setIsUnitOpen] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [autoAddInventory, setAutoAddInventory] = useState(true);
  const [hasManuallySelectedBuyCategory, setHasManuallySelectedBuyCategory] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemAmount, setEditItemAmount] = useState('');
  const [editItemPrice, setEditItemPrice] = useState('');
  const [editStoreName, setEditStoreName] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const [addedDeals, setAddedDeals] = useState<string[]>([]);

  const [activeStoreTab, setActiveStoreTab] = useState('All');
  const [customStoreTabs, setCustomStoreTabs] = useState<string[]>(['Walmart', 'T&T Supermarket']);
  const [isAddingStoreTab, setIsAddingStoreTab] = useState(false);
  const [newStoreTabName, setNewStoreTabName] = useState('');

  const handleAddFlyerDeal = (deal: typeof WEEKLY_FLYER_DEALS[0]) => {
    onAddShoppingItem({ 
      id: Math.random().toString(36).substring(7), 
      name: deal.name, 
      category: deal.category, 
      checked: false, 
      price: deal.price, 
      storeName: deal.storeName 
    } as ShoppingItem);
    
    setAddedDeals(prev => [...prev, deal.id]);
    setTimeout(() => {
      setAddedDeals(prev => prev.filter(id => id !== deal.id));
    }, 2000);
  };

  const startEditingItem = (item: ShoppingItem) => {
    setEditingItemId(item.id);
    setEditItemName(item.name);
    setEditItemAmount(item.amount || '');
    setEditItemPrice(item.price || '');
    setEditStoreName(item.storeName || '');
    setEditCategory(item.category);
  };

  const saveEditItem = () => {
    if (editingItemId && editItemName.trim()) {
      onUpdateShoppingItem(editingItemId, {
        name: editItemName.trim(),
        amount: editItemAmount.trim(),
        price: editItemPrice.trim(),
        storeName: editStoreName.trim(),
        category: editCategory
      });
    }
    setEditingItemId(null);
  };

  const priceHistoryText = React.useMemo(() => {
    if (!newItemName.trim() || newItemName.length < 2) return null;
    const history = purchaseHistory.filter(record => record.name.toLowerCase() === newItemName.trim().toLowerCase());
    if (history.length === 0) return null;

    history.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
    const lastRecord = history[0];
    
    let lowestRecord = history[0];
    const getNum = (p: string) => {
       const match = p.match(/\d+(\.\d+)?/);
       return match ? parseFloat(match[0]) : Infinity;
    };
    
    history.forEach(r => {
       if (getNum(r.price) < getNum(lowestRecord.price)) {
           lowestRecord = r;
       }
    });

    if (lastRecord.price === lowestRecord.price && lastRecord.storeName === lowestRecord.storeName) {
        return `Last bought at ${lastRecord.storeName} for ${lastRecord.price}`;
    }
    return `Last bought at ${lastRecord.storeName} for ${lastRecord.price}, lowest record at ${lowestRecord.storeName} for ${lowestRecord.price}`;
  }, [newItemName, purchaseHistory]);

  useEffect(() => {
    if (newItemName.length > 2 && !hasManuallySelectedBuyCategory) {
      const suggestion = suggestCategory(newItemName);
      if (suggestion) {
        setSelectedCategory(suggestion);
      }
    }
  }, [newItemName, hasManuallySelectedBuyCategory]);

  useEffect(() => {
    if (activeCompletingItem && activeCompletingItem.id === 'direct-purchase' && activeCompletingItem.name.length > 2) {
      const suggestion = suggestCategory(activeCompletingItem.name);
      if (suggestion && activeCompletingItem.category === 'Household') {
        setActiveCompletingItem({...activeCompletingItem, category: suggestion});
        setAutoAddInventory(suggestion !== 'Household');
      }
    }
  }, [activeCompletingItem?.name]);

  const activeItems = shoppingList.filter(item => !item.checked);

  const allStoreTabs = React.useMemo(() => {
    const stores = new Set<string>(customStoreTabs);
    activeItems.forEach(item => {
      if (item.storeName && item.storeName !== 'Anywhere') {
        stores.add(item.storeName);
      }
    });
    return Array.from(stores).sort();
  }, [activeItems, customStoreTabs]);

  const activeItemsByStore = activeItems.reduce((acc, item) => {
    const store = item.storeName || 'Anywhere';
    if (!acc[store]) acc[store] = [];
    acc[store].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);
  
  const handleAddItemToBuy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    let targetStore = newStoreName.trim();
    if (activeStoreTab !== 'All' && !targetStore) {
      targetStore = activeStoreTab;
    }

    let finalPrice = newItemPrice.trim();
    
    // Auto-fill cheapest price and store if none provided
    if (!finalPrice || !targetStore) {
      const history = purchaseHistory.filter(record => record.name.toLowerCase() === newItemName.trim().toLowerCase());
      if (history.length > 0) {
        let lowestRecord = history[0];
        const getNum = (p: string) => {
           const match = p.match(/\d+(\.\d+)?/);
           return match ? parseFloat(match[0]) : Infinity;
        };
        history.forEach(r => {
           if (getNum(r.price) < getNum(lowestRecord.price)) {
               lowestRecord = r;
           }
        });
        
        if (!finalPrice) {
          finalPrice = lowestRecord.price;
        }
        if (!targetStore && activeStoreTab === 'All') {
          targetStore = lowestRecord.storeName || '';
        }
      }
    }

    const newItem: ShoppingItem = {
      id: Math.random().toString(36).substring(7),
      name: newItemName.trim(),
      category: selectedCategory,
      storeName: targetStore,
      amount: newItemAmount.trim(),
      price: finalPrice,
      checked: false
    };

    onAddShoppingItem(newItem);
    setNewItemName('');
    setNewItemAmount('');
    setNewItemPrice('');
    setNewStoreName('');
    setHasManuallySelectedBuyCategory(false);
  };

  const handleRemoveItem = (id: string) => {
    onDeleteShoppingItem(id);
  };

  const initiateCheck = (item: ShoppingItem) => {
    setActiveCompletingItem(item);
    // Autofill with some logical default or clear
    setStoreName(item.storeName || '');
    setPrice(item.price || '');
    setQuantityBought('1');
    setUnitBought('pcs');
    setIsUnitOpen(false);
    setExpiryDate('');
    setAutoAddInventory(item.category !== 'Household');
  };

  const startDirectPurchase = () => {
    setActiveCompletingItem({ id: 'direct-purchase', name: '', category: 'Household', checked: false });
    setStoreName('');
    setPrice('');
    setQuantityBought('1');
    setUnitBought('pcs');
    setIsUnitOpen(false);
    setExpiryDate('');
    setAutoAddInventory(false);
  };

  const quickCheck = (item: ShoppingItem) => {
    onUpdateShoppingItem(item.id, { 
      checked: true, 
      storeName: item.storeName || 'Unspecified', 
      price: item.price || 'Unspecified', 
      purchaseDate: new Date().toISOString().split('T')[0], 
      quantityBought: item.amount || '1' 
    });

    if (item.category !== 'Household') {
      onAddToInventory({
        name: item.name,
        category: item.category,
        quantity: item.amount || '1',
        location: 'Pantry',
      });
    }
  };

  const submitPurchaseDetails = () => {
    if (!activeCompletingItem) return;
    if (!activeCompletingItem.name.trim()) return;

    const record: PurchaseRecord = {
      id: Math.random().toString(36).substring(7),
      name: activeCompletingItem.name.trim(),
      category: activeCompletingItem.category,
      price: price.trim() ? (price.startsWith('$') ? price.trim() : `$${price.trim()}`) : 'Unspecified',
      storeName: storeName.trim() || 'Unspecified Store',
      purchaseDate: purchaseDate,
      quantityBought: `${quantityBought.trim() || '1'}${unitBought}`
    };

    // 1. Add purchase reference record
    onAddPurchaseRecord(record);

    // 2. Mark shopping item as checked
    if (activeCompletingItem.id !== 'direct-purchase') {
      onUpdateShoppingItem(activeCompletingItem.id, { 
        checked: true, 
        storeName: record.storeName, 
        price: record.price, 
        purchaseDate: record.purchaseDate, 
        quantityBought: record.quantityBought 
      });
    }

    // 3. Option to auto-add to active kitchen inventory
    if (autoAddInventory && activeCompletingItem.category !== 'Household') {
      onAddToInventory({
        name: activeCompletingItem.name,
        category: activeCompletingItem.category,
        quantity: record.quantityBought,
        location: 'Pantry', // default
        expiryDate: expiryDate || undefined, // This triggers the dynamic standard expiry if left empty!
      });
    }

    setActiveCompletingItem(null);
  };

  const filteredHistory = purchaseHistory.filter(record => 
    record.name.toLowerCase().includes(searchHistoryQuery.toLowerCase()) ||
    record.storeName.toLowerCase().includes(searchHistoryQuery.toLowerCase()) ||
    record.category.toLowerCase().includes(searchHistoryQuery.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="pb-32 px-6 pt-24 max-w-2xl mx-auto font-sans"
    >
      <header className="mb-12">
        <h2 className="text-4xl font-light mb-2 text-ink-black">To Buy & References</h2>
        <p className="text-zinc-400 text-sm font-medium">
          Manage your replenishment lists and check past prices & stores.
        </p>
      </header>

      {/* Weekly Flyer Deals */}
      <section className="mb-8">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-red-500 mb-3 flex items-center gap-2">
          <Tag className="w-3.5 h-3.5" />
          Weekly Flyer Deals
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-4 pt-1 snap-x scrollbar-hide">
          {WEEKLY_FLYER_DEALS.map((deal) => (
            <button
              key={deal.id}
              type="button"
              onClick={() => handleAddFlyerDeal(deal)}
              className={`snap-start shrink-0 p-3 bg-white border ${addedDeals.includes(deal.id) ? 'border-bamboo-green bg-green-50' : 'border-red-100 hover:border-red-300'} rounded-[16px] text-left min-w-[140px] shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 text-ink-black flex flex-col gap-1.5`}
            >
              <div className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider ${addedDeals.includes(deal.id) ? 'text-bamboo-green' : 'text-red-500'}`}>
                {addedDeals.includes(deal.id) ? (
                  <><CheckCircle2 className="w-3 h-3" /> Added</>
                ) : (
                  <><Store className="w-3 h-3" /> {deal.storeName}</>
                )}
              </div>
              <div className="font-bold text-sm leading-tight text-ink-black">{deal.name}</div>
              <div className="text-sm font-bold text-zinc-500 bg-red-50 px-2 py-0.5 rounded-md self-start">{deal.price}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Store Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-6 py-2">
        <button
          onClick={() => setActiveStoreTab('All')}
          className={`flex-shrink-0 px-5 py-2.5 rounded-[12px] text-xs font-bold uppercase tracking-widest transition-all border ${
            activeStoreTab === 'All' 
              ? 'bg-ink-black text-white border-ink-black shadow-md' 
              : 'bg-white text-zinc-500 hover:bg-zinc-50 border-zinc-200 hover:shadow-sm'
          }`}
        >
          All Stores
        </button>
        {allStoreTabs.map(store => (
          <button
            key={store}
            onClick={() => setActiveStoreTab(store)}
            className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-xs font-bold uppercase tracking-widest transition-all border ${
              activeStoreTab === store 
                ? 'bg-ink-black text-white border-ink-black shadow-md' 
                : 'bg-white text-zinc-500 hover:bg-zinc-50 border-zinc-200 hover:shadow-sm'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            {store}
          </button>
        ))}
        {isAddingStoreTab ? (
          <form 
            onSubmit={(e) => { 
               e.preventDefault(); 
               if (newStoreTabName.trim() && !allStoreTabs.includes(newStoreTabName.trim())) {
                 setCustomStoreTabs([...customStoreTabs, newStoreTabName.trim()]);
                 setActiveStoreTab(newStoreTabName.trim());
               }
               setNewStoreTabName('');
               setIsAddingStoreTab(false);
            }} 
            className="flex-shrink-0 flex items-center bg-white border border-ink-black rounded-[12px] px-2 py-1 shadow-sm"
          >
            <input 
              autoFocus 
              value={newStoreTabName} 
              onChange={e => setNewStoreTabName(e.target.value)} 
              onBlur={() => setIsAddingStoreTab(false)}
              placeholder="Store name..."
              className="bg-transparent border-none focus:outline-none text-xs px-3 py-1.5 w-32 text-ink-black uppercase font-bold tracking-widest"
            />
          </form>
        ) : (
          <button 
            onClick={() => setIsAddingStoreTab(true)}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-xs font-bold uppercase tracking-widest transition-all border bg-white text-zinc-500 border-zinc-200 border-dashed hover:border-zinc-300 hover:bg-zinc-50"
          >
            <Plus className="w-3.5 h-3.5" /> Store
          </button>
        )}
      </div>

      {/* Part 1: Quick Add to Buy Form */}
      <section className="mb-10 p-6 bg-zinc-50 rounded-[20px] border border-zinc-100">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4 flex items-center gap-2">
          <ShoppingBag className="w-3.5 h-3.5 text-ink-black" />
          Add Item to {activeStoreTab === 'All' ? 'buy' : activeStoreTab}
        </h3>
        
        <form onSubmit={handleAddItemToBuy} className="flex flex-col gap-3">
          <div className="flex flex-col">
            <input 
              type="text"
              placeholder={`What should we buy${activeStoreTab !== 'All' ? ` at ${activeStoreTab}` : ''}? (e.g., Avocados, Soy sauce)`}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-[12px] text-sm focus:outline-none focus:border-zinc-400 transition-colors"
            />
            {priceHistoryText && (
              <span className="text-[10px] text-zinc-500 font-medium px-2 pt-1.5 flex items-center gap-1">
                <Tag className="w-3 h-3 text-bamboo-green" /> {priceHistoryText}
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Amount/Qty (e.g., 2 lbs) - Opt"
              value={newItemAmount}
              onChange={(e) => setNewItemAmount(e.target.value)}
              className="flex-1 w-full sm:w-auto px-4 py-3 bg-white border border-zinc-200 rounded-[12px] text-sm focus:outline-none focus:border-zinc-400 transition-colors"
            />
            <input
              type="text"
              placeholder="Est. Price (e.g., $3.99) - Opt"
              value={newItemPrice}
              onChange={(e) => setNewItemPrice(e.target.value)}
              className="flex-1 w-full sm:w-auto px-4 py-3 bg-white border border-zinc-200 rounded-[12px] text-sm focus:outline-none focus:border-zinc-400 transition-colors"
            />
            {activeStoreTab === 'All' && (
              <input
                type="text"
                placeholder="Where? (e.g., Costco) - Optional"
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                className="flex-1 w-full sm:w-auto px-4 py-3 bg-white border border-zinc-200 rounded-[12px] text-sm focus:outline-none focus:border-zinc-400 transition-colors"
              />
            )}
            <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setHasManuallySelectedBuyCategory(true);
                }}
                className="flex-[2] sm:flex-none px-3 py-3 bg-white border border-zinc-200 rounded-[12px] text-xs font-medium focus:outline-none focus:border-zinc-300 min-w-[120px]"
              >
                {categories.filter(c => c !== 'All Items').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                type="submit"
                className="flex-1 sm:flex-none shrink-0 px-8 py-3 bg-ink-black text-white hover:bg-zinc-800 rounded-[12px] flex items-center justify-center transition-all shadow-sm active:scale-95 text-xs font-bold uppercase tracking-widest gap-2"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Part 2: Active To-Buy List */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Current Items to Buy ({activeItems.length})</h3>
        </div>

        {activeItems.length === 0 ? (
          <div className="p-8 text-center bg-zinc-50/50 rounded-3xl border border-dashed border-zinc-200">
            <p className="text-zinc-500 text-sm font-medium">
              No pending purchases. Everything is fully stocked!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(activeItemsByStore)
              .filter(([store]) => activeStoreTab === 'All' || store === activeStoreTab)
              .map(([store, items]) => (
              <div key={store} className="bg-zinc-50/30 rounded-3xl p-5 shadow-sm border border-zinc-100 animate-in fade-in">
                <div className="flex items-center gap-2 mb-5 pl-2">
                  <div className="w-8 h-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center shadow-sm text-zinc-500">
                    <Store className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-ink-black/70">
                    {store} <span className="text-zinc-400 font-medium tracking-normal ml-1 border pl-2 bg-white rounded-md px-1">{items.length}</span>
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-4 bg-white border border-zinc-100 rounded-2xl flex flex-col hover:shadow-md hover:border-zinc-200 transition-all group gap-3 shadow-sm"
                    >
                      {editingItemId === item.id ? (
                        <div className="flex-1 w-full space-y-3">
                          <div className="flex gap-2 w-full">
                            <input 
                              type="text" 
                              value={editItemName}
                              onChange={(e) => setEditItemName(e.target.value)}
                              className="flex-1 px-3 py-2 bg-white border border-zinc-200 rounded-[8px] text-sm focus:outline-none focus:border-zinc-400"
                              placeholder="Item name"
                              autoFocus
                            />
                            <select
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              className="w-1/3 px-3 py-2 bg-white border border-zinc-200 rounded-[8px] text-xs font-medium focus:outline-none focus:border-zinc-300"
                            >
                              {categories.filter(c => c !== 'All Items').map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                            <input 
                              type="text" 
                              value={editItemAmount}
                              onChange={(e) => setEditItemAmount(e.target.value)}
                              className="flex-1 min-w-[70px] px-3 py-2 bg-white border border-zinc-200 rounded-[8px] text-xs focus:outline-none focus:border-zinc-400"
                              placeholder="Opt. Amount"
                            />
                            <input 
                              type="text" 
                              value={editItemPrice}
                              onChange={(e) => setEditItemPrice(e.target.value)}
                              className="flex-1 min-w-[70px] px-3 py-2 bg-white border border-zinc-200 rounded-[8px] text-xs focus:outline-none focus:border-zinc-400"
                              placeholder="Price"
                            />
                            <input 
                              type="text" 
                              value={editStoreName}
                              onChange={(e) => setEditStoreName(e.target.value)}
                              className="flex-[1.5] min-w-[100px] px-3 py-2 bg-white border border-zinc-200 rounded-[8px] text-xs focus:outline-none focus:border-zinc-400"
                              placeholder="Store (optional)"
                            />
                            <button onClick={saveEditItem} className="px-3 py-2 bg-ink-black text-white text-xs font-bold rounded-[8px] whitespace-nowrap shrink-0">
                              Save
                            </button>
                            <button onClick={() => setEditingItemId(null)} className="px-3 py-2 bg-zinc-200 text-zinc-600 text-xs font-bold rounded-[8px] whitespace-nowrap shrink-0">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3.5 text-left flex-1" title="Click to edit item">
                            <button onClick={(e) => { e.stopPropagation(); quickCheck(item); }} className="shrink-0 p-1" title="Quick check off without logging details">
                              <Circle className="w-5 h-5 text-zinc-400 hover:text-bamboo-green transition-colors" />
                            </button>
                            <div className="flex-1 cursor-text flex items-start justify-between" onClick={() => startEditingItem(item)}>
                              <div className="min-w-0 pr-2">
                                <span className="font-semibold text-ink-black text-sm block mb-1 truncate">{item.name}</span>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 bg-zinc-50 border border-zinc-100 rounded-md px-1.5 py-0.5 w-fit">
                                    {getCategoryIcon(item.category)}
                                    {item.category}
                                  </span>
                                  {item.price && (
                                    <span className="text-[10px] font-bold tracking-wider text-bamboo-green flex items-center gap-1 bg-green-50 border border-green-100 rounded-md px-1.5 py-0.5 w-fit">
                                      <DollarSign className="w-2.5 h-2.5" />
                                      {item.price}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {item.amount && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-50 border border-zinc-100 px-2 py-1 rounded-md shrink-0">
                                  {item.amount}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button 
                              onClick={() => initiateCheck(item)}
                              className="p-1 px-3 bg-white text-ink-black hover:bg-zinc-100 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all flex items-center gap-1 border border-zinc-300 shadow-sm"
                            >
                              Buy <ArrowUpRight className="w-3 h-3 text-zinc-500" />
                            </button>
                            <button 
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Interactive Complete-Purchase Modal / Slider panel */}
      <AnimatePresence>
        {activeCompletingItem && (
          <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              className="bg-white w-full max-w-md rounded-t-[28px] sm:rounded-[20px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-zinc-100 flex justify-between items-start bg-zinc-50">
                <div className="w-full mr-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-bamboo-green" />
                    <span className="text-xs font-bold uppercase tracking-widest text-ink-black">
                      {activeCompletingItem.id === 'direct-purchase' ? 'Log Direct Purchase' : 'Log Purchase'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={activeCompletingItem.name}
                    onChange={(e) => setActiveCompletingItem({...activeCompletingItem, name: e.target.value})}
                    className="w-full text-lg font-bold text-zinc-600 bg-transparent border-b border-transparent hover:border-zinc-200 focus:border-zinc-300 focus:outline-none transition-colors px-0 pb-1"
                    placeholder="Product Name"
                  />
                </div>
                <button 
                  onClick={() => setActiveCompletingItem(null)}
                  className="p-1.5 text-zinc-400 hover:text-ink-black transition-colors shrink-0"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-400 block mb-2 text-left">
                      Category
                    </label>
                    <select 
                      value={activeCompletingItem.category}
                      onChange={(e) => {
                        const cat = e.target.value;
                        setActiveCompletingItem({...activeCompletingItem, category: cat});
                        setAutoAddInventory(cat !== 'Household');
                      }}
                      className="w-full px-3 py-3 bg-zinc-50 border border-zinc-200 rounded-[12px] text-sm focus:outline-none focus:bg-white focus:border-zinc-300"
                    >
                      {categories.filter(c => c !== 'All Items').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-400 block mb-2 text-left flex items-center gap-1.5">
                    <Store className="w-3 h-3 text-zinc-400" /> WHERE (Store Name)
                  </label>
                  <input 
                    type="text" 
                    placeholder="Costco, Supermarket, Costco, Local market..."
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-[12px] text-sm focus:outline-none focus:bg-white focus:border-zinc-400 transition-all font-medium text-ink-black"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-400 block mb-2 flex items-center gap-1.5">
                      <DollarSign className="w-3 h-3 text-zinc-400" /> HOW MUCH (Price paid)
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. $4.99"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-[12px] text-sm focus:outline-none focus:bg-white focus:border-zinc-400 transition-all font-medium text-ink-black"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-400 block mb-2 flex items-center gap-1.5">
                      <Archive className="w-3 h-3 text-zinc-400" /> Quantity
                    </label>
                    <div className="flex flex-col gap-2">
                      <div className="flex bg-zinc-50 border border-zinc-200 rounded-[12px] overflow-visible focus-within:bg-white focus-within:border-zinc-400 transition-all relative">
                        <input 
                          type="number" 
                          value={quantityBought}
                          onChange={(e) => setQuantityBought(e.target.value)}
                          className="w-full border-0 bg-transparent px-4 py-3 text-sm focus:ring-0 font-medium text-ink-black focus:outline-none" 
                        />
                        <div 
                          className="px-4 flex items-center gap-2 cursor-pointer hover:bg-zinc-100 border-l border-zinc-200 relative"
                          onClick={() => setIsUnitOpen(!isUnitOpen)}
                        >
                          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 font-sans">{unitBought}</span>
                          <ChevronDown className={`w-3 h-3 text-zinc-300 transition-transform ${isUnitOpen ? 'rotate-180' : ''}`} />
                          
                          <AnimatePresence>
                            {isUnitOpen && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full right-0 mt-2 bg-white border border-zinc-100 rounded-xl shadow-xl z-20 py-2 min-w-[100px]"
                              >
                                {UNITS.map(u => (
                                  <button 
                                    key={u}
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setUnitBought(u); setIsUnitOpen(false); }}
                                    className="w-full px-4 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-ink-black hover:bg-zinc-50 font-sans"
                                  >
                                    {u}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max={(unitBought === 'g' || unitBought === 'ml') ? 2000 : 50}
                        step={(unitBought === 'g' || unitBought === 'ml') ? 10 : 1}
                        value={Number(quantityBought) || 1}
                        onChange={(e) => setQuantityBought(e.target.value)}
                        className="w-full h-2 mb-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-400 block mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-zinc-400" /> WHEN (Purchase Date)
                  </label>
                  <input 
                    type="date" 
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-[12px] text-sm focus:outline-none focus:bg-white focus:border-zinc-400 transition-all font-medium text-ink-black"
                  />
                </div>

                <div className="pt-2 border-t border-zinc-100 flex items-center gap-3">
                  <input 
                    type="checkbox"
                    id="auto-add-inv"
                    checked={autoAddInventory}
                    onChange={(e) => setAutoAddInventory(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-300 text-bamboo-green focus:ring-bamboo-green cursor-pointer"
                  />
                  <label htmlFor="auto-add-inv" className="text-xs text-zinc-500 font-medium cursor-pointer select-none">
                     Add to active food inventory (uncheck for daily necessities)
                  </label>
                </div>

                {autoAddInventory && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-350">
                    <label className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-400 block mb-2 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-zinc-400" /> EXPIRY DATE (Optional)
                    </label>
                    <input 
                      type="date" 
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-[12px] text-sm focus:outline-none focus:bg-white focus:border-zinc-400 transition-all font-medium text-ink-black"
                    />
                    <p className="mt-1.5 text-[10px] text-zinc-400">
                      If left blank, a typical shelf life of <strong className="text-ink-black font-semibold">{activeCompletingItem ? getNormalShelfLife(activeCompletingItem.name, activeCompletingItem.category) : 7} days</strong> will be used.
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={submitPurchaseDetails}
                  className="w-full py-4 bg-ink-black text-white rounded-[14px] text-xs font-bold uppercase tracking-[0.2em] shadow-lg hover:opacity-95 transition-all active:scale-95"
                >
                  Log Reference & Complete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingHistoryItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ bg: 'rgba(255,255,255,0)' }}
              animate={{ bg: 'rgba(255,255,255,0.8)' }}
              exit={{ bg: 'rgba(255,255,255,0)' }}
              className="absolute inset-0 backdrop-blur-sm"
              onClick={() => setEditingHistoryItem(null)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-[24px] shadow-2xl overflow-hidden border border-zinc-100"
            >
              <div className="p-6 md:p-8 space-y-6">
                <header>
                  <h3 className="text-[17px] font-light text-ink-black mb-1">Edit Purchase Log</h3>
                  <input 
                    type="text"
                    value={editingHistoryItem.name}
                    onChange={(e) => setEditingHistoryItem({...editingHistoryItem, name: e.target.value})}
                    className="w-full text-[21px] font-bold leading-[14px] text-zinc-500 uppercase tracking-widest bg-transparent border-b border-transparent hover:border-zinc-200 focus:border-zinc-300 focus:outline-none transition-colors px-0 pb-1"
                    placeholder="Product Name"
                  />
                </header>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 block mb-2">Store</label>
                    <input 
                      type="text" 
                      value={editingHistoryItem.storeName}
                      onChange={(e) => setEditingHistoryItem({...editingHistoryItem, storeName: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-[12px] text-sm focus:outline-none focus:bg-white focus:border-zinc-400 transition-all font-medium text-ink-black"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 block mb-2">Price</label>
                      <input 
                        type="text" 
                        value={editingHistoryItem.price}
                        onChange={(e) => setEditingHistoryItem({...editingHistoryItem, price: e.target.value})}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-[12px] text-sm focus:outline-none focus:bg-white focus:border-zinc-400 transition-all font-medium text-ink-black"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 block mb-2">Quantity</label>
                      <input 
                        type="text" 
                        value={editingHistoryItem.quantityBought}
                        onChange={(e) => setEditingHistoryItem({...editingHistoryItem, quantityBought: e.target.value})}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-[12px] text-sm focus:outline-none focus:bg-white focus:border-zinc-400 transition-all font-medium text-ink-black"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 block mb-2">Date</label>
                    <input 
                      type="date" 
                      value={editingHistoryItem.purchaseDate}
                      onChange={(e) => setEditingHistoryItem({...editingHistoryItem, purchaseDate: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-[12px] text-sm focus:outline-none focus:bg-white focus:border-zinc-400 transition-all font-medium text-ink-black"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setEditingHistoryItem(null)}
                    className="flex-1 py-4 bg-zinc-50 text-zinc-500 rounded-[14px] text-xs font-bold uppercase tracking-[0.2em] hover:bg-zinc-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdatePurchaseRecord?.(editingHistoryItem.id, editingHistoryItem);
                      setEditingHistoryItem(null);
                    }}
                    className="flex-1 py-4 bg-ink-black text-white rounded-[14px] text-xs font-bold uppercase tracking-[0.2em] shadow-lg hover:opacity-95 transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Part 3: Historical References Database */}
      <section className="mt-16 border-t border-zinc-100 pt-12">
        <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1">REFERENCE INDEX</h3>
            <h2 className="text-xl font-light text-ink-black flex items-center gap-3">
              Purchase History & Prices
              <button 
                onClick={startDirectPurchase}
                className="w-8 h-8 rounded-full bg-white border border-zinc-200 text-ink-black shadow-sm flex items-center justify-center hover:bg-zinc-50 transition-colors"
                title="Log a purchase directly"
              >
                <Plus className="w-4 h-4" />
              </button>
            </h2>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <input 
              type="text"
              placeholder="Search reference logs..."
              value={searchHistoryQuery}
              onChange={(e) => setSearchHistoryQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-washi-gray border border-zinc-100 rounded-xl text-xs focus:outline-none focus:border-zinc-300 transition-colors"
            />
          </div>
        </header>

        {filteredHistory.length === 0 ? (
          <div className="py-12 text-center bg-zinc-50 border border-dashed border-zinc-100 rounded-[16px]">
            <p className="text-[11px] text-zinc-400 font-medium italic">
              {searchHistoryQuery ? 'No matching references found.' : "You haven't purchased anything yet. Log items to build a price index!"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map(record => (
              <div 
                key={record.id} 
                className="bg-white border border-zinc-100 rounded-[16px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:shadow-sm hover:border-zinc-200 transition-all group"
                onClick={() => setEditingHistoryItem(record)}
              >
                <div className="flex-1">
                  <div className="flex items-start justify-between sm:justify-start sm:gap-4 mb-2 sm:mb-1">
                    <div>
                      <h4 className="font-semibold text-ink-black text-sm mb-1">{record.name}</h4>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 w-fit bg-zinc-50 border border-zinc-100 rounded-md px-1.5 py-0.5">
                        {getCategoryIcon(record.category)}
                        {record.category}
                      </span>
                    </div>
                    <div className="text-right sm:hidden">
                      <div className="font-bold text-ink-black text-sm">{record.price}</div>
                      <div className="text-[11px] font-medium text-zinc-500 bg-zinc-50 rounded-md px-1 py-0.5 mt-1 border border-zinc-100">Qty: {record.quantityBought}</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-600 bg-zinc-50 px-2 py-1.5 rounded-md border border-zinc-200">
                      <Store className="w-4 h-4 text-zinc-500" />
                      {record.storeName}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-600 bg-zinc-50 px-2 py-1.5 rounded-md border border-zinc-200">
                      <Calendar className="w-4 h-4 text-zinc-500" />
                      {record.purchaseDate}
                    </div>
                  </div>
                </div>

                <div className="hidden sm:flex flex-col items-end gap-1 mb-2 pr-4 border-r border-zinc-200">
                  <span className="font-bold text-ink-black text-base">{record.price}</span>
                  <span className="text-[11px] uppercase font-bold tracking-wider text-zinc-500">Qty: {record.quantityBought}</span>
                </div>

                <div className="flex justify-end mt-2 sm:mt-0">
                  <button 
                    type="button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      if(window.confirm('Delete this record?')) {
                        onDeletePurchaseRecord?.(record.id);
                      }
                    }} 
                    className="p-2 bg-white border border-zinc-100 text-zinc-400 rounded-full hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}
