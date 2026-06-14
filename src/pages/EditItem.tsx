import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, ChevronDown, Trash2, Check, Plus, Image as ImageIcon, RotateCcw, Sparkles, Upload } from 'lucide-react';
import { CustomCalendar } from '../components/CustomCalendar';
import { View, InventoryItem } from '../types';
import { getFoodImage, suggestCategory, getNormalShelfLife, getRandomFoodImage } from '../lib/imageUtils';

interface EditItemProps {
  item?: InventoryItem;
  onViewChange: (view: View) => void;
  onUpdateItem: (updates: Partial<InventoryItem>) => void;
  onDeleteItem: () => void;
  categories: string[];
  onAddCategory: (category: string) => void;
}

const UNITS = ['g', 'kg', 'lbs', 'ml', 'l', 'pcs', 'packs', 'cups', 'spoons', 'cans', 'bottles', 'bags', 'boxes'];

export default function EditItem({ item, onViewChange, onUpdateItem, onDeleteItem, categories, onAddCategory }: EditItemProps) {
  const [name, setName] = useState(item?.name || '');
  const [quantityValue, setQuantityValue] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [category, setCategory] = useState(item?.category || '');
  const [expiryDate, setExpiryDate] = useState('');
  const [location, setLocation] = useState(item?.location || 'Fridge');
  const [image, setImage] = useState(item?.image || '');
  
  const [isUnitOpen, setIsUnitOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [hasManuallySelectedCategory, setHasManuallySelectedCategory] = useState(false);

  const setRelativeDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setExpiryDate(date.toISOString().split('T')[0]);
  };

  // Auto-suggest category
  useEffect(() => {
    if (name.length > 2 && name !== item?.name) {
      const suggestion = suggestCategory(name);
      setSuggestedCategory(suggestion);
      if (suggestion && !hasManuallySelectedCategory) {
        setCategory(suggestion);
      }
    } else {
      setSuggestedCategory(null);
    }
  }, [name, item?.name, hasManuallySelectedCategory]);

  useEffect(() => {
    if (item) {
      setName(item.name);
      // Try to split quantity into value and unit
      const match = item.quantity.match(/^([0-9.]+)\s*([a-zA-Z]+)$/);
      if (match) {
        setQuantityValue(match[1]);
        setUnit(match[2]);
      } else {
        setQuantityValue(item.quantity);
      }
      setCategory(item.category);
      setLocation(item.location);
      setImage(item.image || '');
      setExpiryDate(item.expiryDate || '');
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    onUpdateItem({
      name,
      quantity: `${quantityValue}${unit}`,
      category,
      location,
      expiryDate: expiryDate || undefined,
      image
    });
  };

  const handleRefreshImage = () => {
    setImage(getRandomFoodImage());
  };

  if (!item) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-32 pt-24 px-6 max-w-lg mx-auto"
    >
      <header className="mb-12 px-2 flex justify-between items-start">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-300 mb-2 block font-sans">Details & Mood</span>
          <h2 className="text-4xl font-light leading-tight text-ink-black">{item.name}</h2>
        </div>
        <button 
          onClick={onDeleteItem}
          className="p-3 bg-red-50 text-red-400 rounded-full hover:bg-red-100 transition-all"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </header>

      <form className="space-y-12 px-2" onSubmit={handleSubmit}>
        {/* Form Grid */}
        <div className="grid grid-cols-1 gap-y-10">
          {/* Name Edit */}
          <FormField label="Product Name">
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-washi-gray border border-zinc-50 rounded-[12px] px-4 py-4 text-sm font-medium text-ink-black focus:ring-0 focus:border-zinc-300 transition-all"
            />
          </FormField>

          {/* Quantity */}
          <FormField label="Quantity">
            <div className="flex flex-col gap-3">
              <div className="flex bg-washi-gray border border-zinc-50 rounded-[12px] overflow-visible focus-within:border-zinc-300 transition-all relative">
                <input 
                  type="number" 
                  value={quantityValue}
                  onChange={(e) => setQuantityValue(e.target.value)}
                  className="w-full border-0 bg-transparent px-4 py-4 focus:ring-0 font-medium text-ink-black" 
                />
                <div 
                  className="px-4 flex items-center gap-2 cursor-pointer hover:bg-zinc-100 border-l border-zinc-50 relative"
                  onClick={() => setIsUnitOpen(!isUnitOpen)}
                >
                  <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 font-sans">{unit}</span>
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
                            onClick={() => { setUnit(u); setIsUnitOpen(false); }}
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
                max={(unit === 'g' || unit === 'ml') ? 2000 : 50}
                step={(unit === 'g' || unit === 'ml') ? 10 : 1}
                value={Number(quantityValue) || 1}
                onChange={(e) => setQuantityValue(e.target.value)}
                className="w-full h-2 mb-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </FormField>

          {/* Category */}
          <FormField label="Category">
             <div className="relative">
              <div 
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className="bg-washi-gray border border-zinc-50 rounded-[12px] px-4 py-4 flex items-center justify-between hover:bg-zinc-100 transition-all cursor-pointer group"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-ink-black">
                    {category}
                  </span>
                  {suggestedCategory && category !== suggestedCategory && (
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCategory(suggestedCategory);
                        setSuggestedCategory(null);
                        setHasManuallySelectedCategory(false);
                      }}
                      className="text-[8px] text-bamboo-green font-bold uppercase tracking-widest mt-1 flex items-center gap-1 hover:opacity-80"
                    >
                      <Sparkles className="w-2 h-2" />
                      Suggested: {suggestedCategory}
                    </button>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-300 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
              </div>

              <AnimatePresence>
                {isCategoryOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-100 rounded-xl shadow-2xl z-20 py-2 max-h-64 overflow-y-auto"
                  >
                    {categories.map(cat => (
                      <button 
                        key={cat}
                        type="button"
                        onClick={() => { setCategory(cat); setIsCategoryOpen(false); setHasManuallySelectedCategory(true); }}
                        className="w-full px-5 py-3 text-left text-xs font-medium text-zinc-500 hover:text-ink-black hover:bg-zinc-50 flex items-center justify-between font-sans"
                      >
                        {cat}
                        {category === cat && <Check className="w-3 h-3 text-bamboo-green" />}
                      </button>
                    ))}
                    <div className="border-t border-zinc-50 mt-2 pt-2 px-2">
                       {isAddingCategory ? (
                         <div className="flex gap-2 p-1">
                            <input 
                              autoFocus
                              className="flex-1 bg-zinc-50 border-0 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-zinc-200 outline-none font-sans"
                              placeholder="New Category..."
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && (() => {
                                onAddCategory(newCategoryName);
                                setCategory(newCategoryName);
                                setIsAddingCategory(false);
                              })()}
                            />
                            <button 
                              type="button"
                              onClick={() => {
                                onAddCategory(newCategoryName);
                                setCategory(newCategoryName);
                                setIsAddingCategory(false);
                              }}
                              className="p-2 bg-ink-black text-white rounded-lg"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                         </div>
                       ) : (
                         <button 
                           type="button"
                           onClick={() => setIsAddingCategory(true)}
                           className="w-full px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-300 hover:text-ink-black flex items-center gap-2 font-sans"
                         >
                           <Plus className="w-3 h-3" />
                           Add New Category
                         </button>
                       )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </FormField>

          {/* Expiry Date */}
          <FormField label="Update Expiry">
            <div className="space-y-4">
              <div className="flex gap-2">
                 {[
                   { label: '+3d', days: 3 },
                   { label: '+1w', days: 7 },
                   { label: '+2w', days: 14 }
                 ].map(opt => (
                   <button
                    key={opt.label}
                    type="button"
                    onClick={() => setRelativeDate(opt.days)}
                    className="flex-1 py-2 bg-zinc-50 border border-zinc-100 rounded-lg text-[9px] font-bold uppercase tracking-widest text-zinc-400 hover:bg-white hover:border-zinc-300 transition-all font-sans"
                   >
                    {opt.label}
                   </button>
                 ))}
              </div>

              <div className="relative group">
                <div className="flex gap-3 items-center">
                  <div className="flex-1 relative">
                    <input 
                      type="text"
                      placeholder="YYYY-MM-DD"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full bg-white border border-zinc-100 rounded-[16px] px-5 py-4 text-sm font-medium text-ink-black placeholder:text-zinc-200 focus:ring-1 focus:ring-ink-black/5 focus:border-ink-black transition-all shadow-sm font-sans"
                    />
                  </div>
                  
                  <div className="relative">
                    <button 
                      type="button"
                      onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                      className="h-[56px] w-[56px] bg-ink-black rounded-[16px] flex items-center justify-center hover:bg-zinc-800 active:scale-95 transition-all shadow-lg group/cal shrink-0 relative"
                    >
                      <Calendar className="w-5 h-5 text-white transition-transform group-hover/cal:scale-110" />
                    </button>

                    <AnimatePresence>
                      {isCalendarOpen && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className="absolute bottom-full right-0 mb-4 z-50 pointer-events-auto"
                        >
                          <CustomCalendar 
                            selectedDate={expiryDate} 
                            onSelect={setExpiryDate} 
                            onClose={() => setIsCalendarOpen(false)} 
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                {expiryDate && (
                  <button
                    type="button"
                    onClick={() => setExpiryDate('')}
                    className="absolute -bottom-6 left-0 text-[8px] font-bold uppercase tracking-[0.2em] text-red-400 hover:text-red-600 transition-all font-sans"
                  >
                    Clear Date
                  </button>
                )}
                {!expiryDate && name && (
                  <p className="mt-2 text-[10px] text-zinc-400 pl-1">
                    If left blank, a normal shelf life of <strong className="text-zinc-600 font-bold">{getNormalShelfLife(name, category)} days</strong> will be applied.
                  </p>
                )}
              </div>
            </div>
          </FormField>

          {/* Location */}
          <FormField label="Location">
            <div className="flex gap-2">
              {['Fridge', 'Pantry', 'Freezer'].map(loc => (
                <button 
                  key={loc}
                  type="button"
                  onClick={() => setLocation(loc)}
                  className={`flex-1 py-4 border rounded-[12px] text-[9px] font-bold uppercase tracking-widest transition-all ${
                    location === loc ? 'bg-ink-black border-ink-black text-white shadow-md' : 'bg-washi-gray border-zinc-50 text-zinc-400 hover:border-zinc-200'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </FormField>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-12">
          <button type="submit" className="flex-[2] bg-ink-black text-white py-4 rounded-[12px] font-bold uppercase tracking-[0.2em] text-[10px] hover:opacity-80 transition-all">
            Save Changes
          </button>
          <button type="button" onClick={() => onViewChange('inventory')} className="flex-1 bg-white border border-zinc-100 text-zinc-400 py-4 rounded-[12px] font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-zinc-50 transition-all">
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 pl-1">{label}</label>
      {children}
    </div>
  );
}
