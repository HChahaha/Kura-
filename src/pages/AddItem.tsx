import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, ChevronDown, Leaf, Plus, Check, Sparkles, RotateCcw, Upload } from 'lucide-react';
import { CustomCalendar } from '../components/CustomCalendar';
import { View, InventoryItem } from '../types';
import { getFoodImage, suggestCategory, getNormalShelfLife, getRandomFoodImage } from '../lib/imageUtils';

interface AddItemProps {
  onViewChange: (view: View) => void;
  onAddItem: (item: Omit<InventoryItem, 'id' | 'daysLeft' | 'isExpiringSoon'>) => void;
  categories: string[];
  onAddCategory: (category: string) => void;
}

const UNITS = ['g', 'kg', 'ml', 'l', 'pcs', 'packs', 'cups', 'spoons', 'cans', 'bottles', 'bags', 'boxes'];

export default function AddItem({ onViewChange, onAddItem, categories, onAddCategory }: AddItemProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [category, setCategory] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [location, setLocation] = useState('Fridge');
  const [image, setImage] = useState('');
  
  const [isUnitOpen, setIsUnitOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);

  // Auto-suggest category
  useEffect(() => {
    if (name.length > 2) {
      const suggestion = suggestCategory(name);
      setSuggestedCategory(suggestion);
      if (suggestion && !category) {
        setCategory(suggestion);
      }
    } else {
      setSuggestedCategory(null);
    }
  }, [name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    onAddItem({
      name,
      quantity: `${quantity}${unit}`,
      category: category || 'Uncategorized',
      location,
      expiryDate: expiryDate || undefined,
      image: image || getFoodImage(name, category)
    });
  };

  const setRelativeDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setExpiryDate(date.toISOString().split('T')[0]);
  };

  const handleAddCategory = () => {
    if (newCategoryName && !categories.includes(newCategoryName)) {
      onAddCategory(newCategoryName);
      setCategory(newCategoryName);
      setNewCategoryName('');
      setIsAddingCategory(false);
    }
  };

  const handleRefreshImage = () => {
    setImage(getRandomFoodImage());
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-32 pt-24 px-6 max-w-xl mx-auto"
    >
      <header className="mb-16 px-2 flex justify-between items-start">
        <div>
          <h2 className="text-4xl font-light leading-tight text-ink-black">Inventory Log</h2>
        </div>
        <button 
          onClick={() => onViewChange('inventory')}
          className="p-3 bg-zinc-50 border border-zinc-100 rounded-full hover:bg-zinc-100 transition-all font-sans"
        >
          <RotateCcw className="w-5 h-5 text-zinc-400 rotate-180" />
        </button>
      </header>

      <form className="space-y-12 px-2" onSubmit={handleSubmit}>
        {/* Photo Preview */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative aspect-video rounded-[32px] overflow-hidden border border-zinc-100 group shadow-lg"
        >
          <img 
            src={image || (name ? getFoodImage(name, category) : getFoodImage('food', category))} 
            alt={name || 'New Item'} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent flex items-end p-6 gap-2">
            <button 
              type="button"
              onClick={handleRefreshImage}
              className="px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/40 transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-3 h-3" />
              Random Image
            </button>
            <label className="px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/40 transition-all flex items-center gap-2 cursor-pointer">
              <Upload className="w-3 h-3" />
              Upload Photo
              <input 
                type="file" 
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImage(URL.createObjectURL(file));
                  }
                }}
              />
            </label>
          </div>
        </motion.div>

        {/* Main Input */}
        <div className="space-y-6">
          <input 
            type="text" 
            placeholder="What are you adding?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent border-0 border-b border-zinc-100 py-6 text-3xl font-light placeholder:text-zinc-200 focus:ring-0 focus:border-ink-black transition-all duration-500 text-ink-black"
          />
          <div className="flex flex-wrap gap-2 items-center pt-2">
            <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest mr-2 font-sans">Frequent:</span>
            {['Oat Milk', 'Avocados', 'Miso Paste', 'Eggs', 'Tofu'].map(tag => (
              <button 
                key={tag} 
                type="button" 
                onClick={() => setName(tag)}
                className={`px-4 py-1.5 border rounded-[12px] text-[10px] font-bold uppercase tracking-widest transition-all ${
                  name === tag ? 'bg-ink-black border-ink-black text-white shadow-md' : 'bg-washi-gray border-zinc-100 text-zinc-400 hover:text-ink-black'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
          {/* Quantity & Units */}
          <FormField label="Quantity">
            <div className="flex bg-washi-gray border border-zinc-50 rounded-[12px] overflow-visible focus-within:border-zinc-300 transition-all relative">
              <input 
                type="number" 
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
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
          </FormField>

          {/* Category */}
          <FormField label="Category">
            <div className="relative">
              <div 
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className="bg-washi-gray border border-zinc-50 rounded-[12px] px-4 py-4 flex items-center justify-between hover:bg-zinc-100 transition-all cursor-pointer group relative"
              >
                <div className="flex flex-col">
                  <span className={`text-sm font-medium ${category ? 'text-ink-black' : 'text-zinc-300'}`}>
                    {category || 'Select category'}
                  </span>
                  {suggestedCategory && !category && (
                    <span className="text-[8px] text-bamboo-green font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                      <Sparkles className="w-2 h-2" />
                      Suggested: {suggestedCategory}
                    </span>
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
                        onClick={() => { setCategory(cat); setIsCategoryOpen(false); }}
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
                              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                            />
                            <button 
                              type="button"
                              onClick={handleAddCategory}
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
          <FormField label="Expiry Date">
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
                      className="h-[56px] w-[56px] bg-ink-black rounded-[16px] flex items-center justify-center hover:bg-zinc-800 active:scale-95 transition-all shadow-lg group/cal shrink-0"
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
          <FormField label="Store Location">
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
          <button type="submit" disabled={!name} className="flex-[2] bg-ink-black text-white py-4 rounded-[12px] font-bold uppercase tracking-[0.2em] text-[10px] hover:opacity-80 transition-all disabled:opacity-30">
            Add to Kitchen
          </button>
          <button type="button" onClick={() => onViewChange('inventory')} className="flex-1 bg-white border border-zinc-100 text-zinc-400 py-4 rounded-[12px] font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-zinc-50 transition-all">
            Discard
          </button>
        </div>
      </form>

      {/* Sustainable Tip Card */}
      <section className="mt-24 px-2">
        <div className="bg-washi-gray border border-zinc-50 rounded-[12px] overflow-hidden flex flex-col md:flex-row items-center p-2 relative group">
          <div className="w-full md:w-48 h-48 rounded-[8px] overflow-hidden">
            <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover grayscale-[0.5] opacity-80" alt="Stock" referrerPolicy="no-referrer" />
          </div>
          <div className="p-8 flex-1">
             <div className="flex items-center gap-2 mb-3">
               <Leaf className="w-4 h-4 text-green-600" />
               <h3 className="text-lg font-light text-ink-black">Sustainable Stock</h3>
             </div>
             <p className="text-zinc-400 text-xs leading-relaxed">
               Maintain balance in your kitchen through mindful logging. Tracking expiry dates reduces waste and honors the source.
             </p>
          </div>
        </div>
      </section>
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
