import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, Plus, BookOpen, Clock, Flame, Trash2 } from 'lucide-react';
import { InventoryItem } from '../types';

interface RecipesProps {
  inventory: InventoryItem[];
  customRecipes: any[];
  lastAddedIngredient: string | null;
  onViewChange: (view: any) => void;
  onSelectRecipe: (id: string) => void;
  onDeleteRecipe: (id: string) => void;
}

export default function Recipes({ 
  inventory, 
  customRecipes, 
  lastAddedIngredient, 
  onViewChange, 
  onSelectRecipe, 
  onDeleteRecipe
}: RecipesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState("All");

  const handleRecipeClick = (id: string) => {
    onSelectRecipe(id);
    onViewChange('recipe-detail');
  };

  // Dynamically compute active list of categories present in user's creations
  const categoriesList = useMemo(() => {
    const cats = new Set<string>(["All"]);
    customRecipes.forEach(r => {
      if (r.category) {
        cats.add(r.category);
      }
    });
    return Array.from(cats);
  }, [customRecipes]);

  const filteredRecipes = useMemo(() => {
    let list = customRecipes;
    
    if (activeCategory !== "All") {
      list = list.filter(r => r.category === activeCategory);
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => 
        r.name.toLowerCase().includes(q) || 
        r.description?.toLowerCase().includes(q) ||
        r.fullIngredients?.some((ing: any) => ing.name.toLowerCase().includes(q))
      );
    }
    
    return list;
  }, [customRecipes, activeCategory, searchQuery]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-40 px-6 pt-24 max-w-lg mx-auto relative font-sans"
    >
      <header className="mb-8">
        <h1 className="text-4xl font-light mb-6 tracking-tight text-ink-black">My Personal Cookbook</h1>

        {/* Create Your Own Recipe Banner */}
        <div 
          onClick={() => onViewChange('add-recipe')}
          className="bg-ink-black text-white p-6 rounded-[28px] mb-8 relative overflow-hidden group hover:bg-zinc-800 transition-all cursor-pointer shadow-lg flex flex-col justify-between"
          id="create-recipe-banner"
        >
          <div className="relative z-10 mb-4">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1 block">SCRAPBOOK COLLAGE</span>
            <h2 className="text-xl font-light tracking-tight mb-2">Create Your Own Recipe</h2>
            <p className="text-xs text-zinc-400 font-light leading-relaxed max-w-[85%]">
              Design a custom culinary masterpiece. Pick ingredients from your active inventory, add your instructions, and build your bespoke cookbook ledger.
            </p>
          </div>
          <div className="relative z-10 mt-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white">
            <span>Begin Crafting</span>
            <Plus className="w-3.5 h-3.5 text-white stroke-[2.5px]" />
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4 group-hover:scale-110 transition-all duration-500 pointer-events-none select-none">
            <BookOpen className="w-32 h-32 text-zinc-100" />
          </div>
        </div>

        {/* Search Input */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 w-5 h-5 transition-colors group-focus-within:text-ink-black" />
          <input 
            type="text" 
            placeholder="Search my custom recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-washi-gray border border-zinc-100 rounded-2xl focus:ring-0 focus:border-zinc-300 outline-none transition-all placeholder:text-zinc-400 text-sm font-light text-ink-black"
          />
        </div>
      </header>

      {/* Filter and Category Chips */}
      {categoriesList.length > 1 && (
        <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar py-2 -mx-2 px-2">
          {categoriesList.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap border transition-all ${
                activeCategory === cat 
                  ? 'bg-ink-black text-white border-ink-black shadow-md' 
                  : 'bg-white text-zinc-400 border-zinc-100 hover:border-zinc-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Main Recipe Grid */}
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">
            {activeCategory} Creations ({filteredRecipes.length})
          </h2>
        </div>

        {filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {filteredRecipes.map((recipe) => (
              <RecipeGridCard 
                key={recipe.id} 
                recipe={recipe} 
                onDeleteRecipe={onDeleteRecipe}
                onClick={() => handleRecipeClick(recipe.id)}
              />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center bg-washi-gray/50 rounded-[32px] border border-dashed border-zinc-100">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-50 shadow-sm">
              <BookOpen className="w-5 h-5 text-zinc-300" />
            </div>
            <p className="text-zinc-400 text-xs font-light italic">No hand-made cookbook recipes found.</p>
            <button
              onClick={() => onViewChange('add-recipe')}
              className="mt-4 px-5 py-2.5 bg-ink-black text-white text-[9px] font-bold uppercase tracking-widest rounded-full hover:bg-zinc-800 transition-colors"
            >
              Create Your First Recipe
            </button>
          </div>
        )}
      </div>

      {/* Sticky float creator button */}
      <button 
        onClick={() => onViewChange('add-recipe')}
        className="fixed bottom-24 right-6 w-14 h-14 bg-ink-black text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-40"
        id="recipes-floating-add-btn"
      >
        <Plus className="w-6 h-6" />
      </button>
    </motion.div>
  );
}

function RecipeGridCard(props: any) {
  const { recipe, onDeleteRecipe, onClick } = props;
  return (
    <div 
      onClick={onClick}
      className="bg-white border border-zinc-100 rounded-2xl overflow-hidden group cursor-pointer transition-all hover:bg-zinc-50 relative aspect-[4/5] shadow-sm flex flex-col"
    >
      <div className="relative h-2/3 w-full overflow-hidden">
        <img 
          src={recipe.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300'} 
          alt={recipe.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        
        {/* Delete Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDeleteRecipe(recipe.id);
          }}
          className="absolute top-2.5 right-2.5 w-7 h-7 bg-white/90 hover:bg-red-50 hover:text-red-500 backdrop-blur-md rounded-full flex items-center justify-center border border-zinc-100 shadow-md text-zinc-400 transition-all z-10"
          title="Delete custom recipe"
        >
          <Trash2 className="w-3.5 h-3.5 text-zinc-400 group-hover:text-red-500 transition-colors" />
        </button>

        {/* Custom creation tag */}
        <span className="absolute top-2.5 left-2.5 bg-ink-black/85 backdrop-blur-sm text-[8px] tracking-widest font-bold text-white px-2 py-0.5 rounded uppercase">
          Handmade
        </span>
      </div>

      <div className="p-3.5 flex flex-col justify-between flex-1">
        <div>
          <h3 className="text-xs font-semibold text-ink-black line-clamp-2 leading-snug mb-1 group-hover:text-zinc-650 transition-colors">
            {recipe.name}
          </h3>
          <p className="text-[9px] text-zinc-400 capitalize tracking-wide mb-1 font-light">
            {recipe.category || 'Kitchen Notebook'}
          </p>
        </div>

        <div className="flex items-center justify-between text-[9px] font-medium text-zinc-400 border-t border-zinc-50 pt-2 mt-auto">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-zinc-300" />
            {recipe.time || '15 mins'}
          </span>
          {recipe.calories && (
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-zinc-300" />
              {recipe.calories} kcal
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
