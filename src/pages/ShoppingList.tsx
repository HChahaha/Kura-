import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Search, Plus, Trash2, Calendar, Store, DollarSign, Archive, CheckCircle2, Circle, AlertCircle, ArrowUpRight } from 'lucide-react';
import { ShoppingItem, PurchaseRecord, View, InventoryItem } from '../types';
import { getNormalShelfLife } from '../lib/imageUtils';

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
  const [selectedCategory, setSelectedCategory] = useState('Pantry');
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');
  
  // Custom purchase details state
  const [activeCompletingItem, setActiveCompletingItem] = useState<ShoppingItem | null>(null);
  const [editingHistoryItem, setEditingHistoryItem] = useState<PurchaseRecord | null>(null);
  const [storeName, setStoreName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [price, setPrice] = useState('');
  const [quantityBought, setQuantityBought] = useState('1 unit');
  const [expiryDate, setExpiryDate] = useState('');
  const [autoAddInventory, setAutoAddInventory] = useState(true);

  type ColumnId = 'ingredient' | 'store' | 'date' | 'quantity' | 'price' | 'actions';
  const [columnOrder, setColumnOrder] = useState<ColumnId[]>([
    'ingredient', 'store', 'date', 'quantity', 'price', 'actions'
  ]);
  const [draggedColumn, setDraggedColumn] = useState<ColumnId | null>(null);

  const columnDefinitions: Record<ColumnId, { label: React.ReactNode, renderCell: (record: PurchaseRecord) => React.ReactNode, cellClasses?: string, headerClasses?: string }> = {
    ingredient: {
      label: 'Ingredient',
      renderCell: (record) => (
        <>
          <span className="text-sm font-semibold text-ink-black block">{record.name}</span>
          <span className="text-[8px] font-bold text-zinc-300 uppercase tracking-wider">{record.category}</span>
        </>
      ),
      cellClasses: ""
    },
    store: {
      label: <>Where<br/>(Store)</>,
      renderCell: (record) => (
        <div className="flex items-center gap-1.5">
          <Store className="w-3 h-3 text-zinc-300 shrink-0" />
          {record.storeName}
        </div>
      ),
      cellClasses: "text-xs font-medium text-zinc-600"
    },
    date: {
      label: 'When (Date)',
      renderCell: (record) => (
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3 text-zinc-300 shrink-0" />
          {record.purchaseDate}
        </div>
      ),
      cellClasses: "text-xs text-zinc-500 font-sans"
    },
    quantity: {
      label: 'Quantity',
      renderCell: (record) => record.quantityBought,
      cellClasses: "text-xs text-zinc-500 font-medium"
    },
    price: {
      label: 'How Much',
      renderCell: (record) => record.price,
      cellClasses: "text-sm font-bold text-ink-black font-sans text-right",
      headerClasses: "text-right"
    },
    actions: {
      label: '',
      renderCell: (record) => (
        <div className="flex justify-end gap-2">
          <button 
            type="button" 
            onClick={() => setEditingHistoryItem(record)} 
            className="text-zinc-400 hover:text-ink-black transition-colors"
            title="Edit"
          >
            <span className="text-xs uppercase font-bold tracking-wider">Edit</span>
          </button>
          <button 
            type="button" 
            onClick={() => {
              if(window.confirm('Delete this record?')) {
                onDeletePurchaseRecord?.(record.id);
              }
            }} 
            className="text-zinc-400 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
      cellClasses: "text-right",
      headerClasses: "text-right"
    }
  };

  const handleDragStart = (e: React.DragEvent, col: ColumnId) => {
    setDraggedColumn(col);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      if (e.target instanceof HTMLElement) {
        e.target.classList.add('opacity-50');
      }
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetCol: ColumnId) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === targetCol) return;
    
    setColumnOrder(prev => {
      const newOrder = [...prev];
      const draggedIdx = newOrder.indexOf(draggedColumn);
      const targetIdx = newOrder.indexOf(targetCol);
      
      newOrder.splice(draggedIdx, 1);
      newOrder.splice(targetIdx, 0, draggedColumn);
      
      return newOrder;
    });
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedColumn(null);
    if (e.target instanceof HTMLElement) {
      e.target.classList.remove('opacity-50');
    }
  };

  const activeItems = shoppingList.filter(item => !item.checked);
  
  const handleAddItemToBuy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: ShoppingItem = {
      id: Math.random().toString(36).substring(7),
      name: newItemName.trim(),
      category: selectedCategory,
      checked: false
    };

    onAddShoppingItem(newItem);
    setNewItemName('');
  };

  const handleRemoveItem = (id: string) => {
    onDeleteShoppingItem(id);
  };

  const initiateCheck = (item: ShoppingItem) => {
    setActiveCompletingItem(item);
    // Autofill with some logical default or clear
    setStoreName('');
    setPrice('');
    setQuantityBought('1 unit');
    setExpiryDate('');
  };

  const submitPurchaseDetails = () => {
    if (!activeCompletingItem) return;

    const record: PurchaseRecord = {
      id: Math.random().toString(36).substring(7),
      name: activeCompletingItem.name,
      category: activeCompletingItem.category,
      price: price.trim() ? (price.startsWith('$') ? price.trim() : `$${price.trim()}`) : 'Unspecified',
      storeName: storeName.trim() || 'Unspecified Store',
      purchaseDate: purchaseDate,
      quantityBought: quantityBought.trim() || '1 unit'
    };

    // 1. Add purchase reference record
    onAddPurchaseRecord(record);

    // 2. Mark shopping item as checked
    onUpdateShoppingItem(activeCompletingItem.id, { 
      checked: true, 
      storeName: record.storeName, 
      price: record.price, 
      purchaseDate: record.purchaseDate, 
      quantityBought: record.quantityBought 
    });

    // 3. Option to auto-add to active kitchen inventory
    if (autoAddInventory) {
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

      {/* Part 1: Quick Add to Buy Form */}
      <section className="mb-10 p-6 bg-zinc-50 rounded-[20px] border border-zinc-100">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4 flex items-center gap-2">
          <ShoppingBag className="w-3.5 h-3.5 text-ink-black" />
          Add Item to buy
        </h3>
        
        <form onSubmit={handleAddItemToBuy} className="flex flex-col sm:flex-row gap-3">
          <input 
            type="text"
            placeholder="What should we buy? (e.g., Avocados, Soy sauce)"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="flex-1 px-4 py-3 bg-white border border-zinc-200 rounded-[12px] text-sm focus:outline-none focus:border-zinc-400 transition-colors"
          />
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-3 bg-white border border-zinc-200 rounded-[12px] text-xs font-medium focus:outline-none focus:border-zinc-300"
            >
              {categories.filter(c => c !== 'All Items').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              type="submit"
              className="px-5 py-3 bg-ink-black text-white hover:bg-zinc-800 rounded-[12px] flex items-center justify-center transition-all shadow-sm active:scale-95 text-xs font-bold uppercase tracking-widest gap-2"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </form>
      </section>

      {/* Part 2: Active To-Buy List */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Current Items to Buy ({activeItems.length})</h3>
        </div>

        {activeItems.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-[16px] border border-dashed border-zinc-200">
            <p className="text-zinc-400 text-[11px] italic font-medium">
              No pending purchases. Everything is fully stocked!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeItems.map(item => (
              <div 
                key={item.id} 
                className="p-4 bg-white border border-zinc-100 rounded-[14px] flex items-center justify-between hover:shadow-sm transition-all group"
              >
                <button
                  onClick={() => initiateCheck(item)}
                  className="flex items-center gap-3.5 text-left flex-1"
                >
                  <Circle className="w-5 h-5 text-zinc-300 hover:text-bamboo-green transition-colors shrink-0" />
                  <div>
                    <span className="font-semibold text-ink-black text-sm block">{item.name}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-300">{item.category}</span>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => initiateCheck(item)}
                    className="p-1 px-3.5 bg-zinc-50 text-ink-black hover:bg-zinc-100 text-[9px] font-bold uppercase tracking-widest rounded-full transition-all flex items-center gap-1 border border-zinc-100 opacity-60 group-hover:opacity-100"
                  >
                    Buy <ArrowUpRight className="w-2.5 h-2.5" />
                  </button>
                  <button 
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-2 text-zinc-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
              <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-bamboo-green" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-ink-black">Log Purchase: {activeCompletingItem.name}</h3>
                </div>
                <button 
                  onClick={() => setActiveCompletingItem(null)}
                  className="p-1.5 text-zinc-400 hover:text-ink-black transition-colors"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto">
                <div>
                  <label className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-400 block mb-2 flex items-center gap-1.5">
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
                      <Archive className="w-3 h-3 text-zinc-400" /> Quantity Bought
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g., 2 packs, 1.0L"
                      value={quantityBought}
                      onChange={(e) => setQuantityBought(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-[12px] text-sm focus:outline-none focus:bg-white focus:border-zinc-400 transition-all font-medium text-ink-black"
                    />
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
                     Automatically restock to active inventory list
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
                  <h3 className="text-xl font-light text-ink-black mb-1">Edit Purchase Log</h3>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{editingHistoryItem.name}</p>
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
            <h2 className="text-xl font-light text-ink-black">Purchase History & Prices</h2>
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
          <div className="overflow-x-auto rounded-[16px] border border-zinc-100">
            <table className="w-full text-left border-collapse bg-white">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-100">
                  {columnOrder.map(col => (
                    <th 
                      key={col}
                      draggable
                      onDragStart={(e) => handleDragStart(e, col)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, col)}
                      onDragEnd={handleDragEnd}
                      className={`py-3 px-4 text-[9px] font-bold uppercase tracking-wider text-zinc-400 cursor-move hover:bg-zinc-100/50 transition-colors ${columnDefinitions[col].headerClasses || ''}`}
                      title="Drag to reorder column"
                    >
                      {columnDefinitions[col].label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {filteredHistory.map(record => (
                  <tr key={record.id} className="hover:bg-zinc-50/55 transition-colors">
                    {columnOrder.map(col => (
                      <td key={`${record.id}-${col}`} className={`py-3.5 px-4 ${columnDefinitions[col].cellClasses || ''}`}>
                        {columnDefinitions[col].renderCell(record)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </motion.div>
  );
}
