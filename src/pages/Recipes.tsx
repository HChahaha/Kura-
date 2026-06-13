import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Plus, BookOpen, Clock, Flame, Trash2, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { InventoryItem } from '../types';
import { getRemainingRecipes, incrementRecipes } from '../lib/limits';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

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
  const [remainingRecipes, setRemainingRecipes] = useState<number>(3);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Load remaining recipes on mount
  useEffect(() => {
    async function loadLimits() {
      const userId = auth.currentUser?.uid || '';
      const remaining = await getRemainingRecipes(userId);
      setRemainingRecipes(remaining);
    }
    loadLimits();
  }, []);

  const handleRecipeClick = (id: string) => {
    onSelectRecipe(id);
    onViewChange('recipe-detail');
  };

  const generateAiRecipe = async () => {
    if (inventory.length === 0) {
      setAiError("Your inventory is empty. Please add some grocery ingredients first so Kura can suggest recipes.");
      return;
    }
    
    const userId = auth.currentUser?.uid || '';
    if (remainingRecipes <= 0) {
      setAiError("You have reached your daily limit of 3 AI recipe generation requests.");
      return;
    }

    try {
      setIsAiLoading(true);
      setAiError(null);

      const ingredientsList = inventory.map(item => `${item.name} (${item.quantity || 'some'})`);
      
      const res = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: ingredientsList })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to generate recommended recipe");
      }

      const data = await res.json();

      // Decrement remaining suggestions limit
      const newRemaining = await incrementRecipes(userId);
      setRemainingRecipes(newRemaining);

      // Save to database as custom recipe
      const recipeId = `ai-${Math.random().toString(36).substring(7)}`;
      const recipeDoc = {
        id: recipeId,
        name: data.title || "AI Suggested Creation",
        image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=800",
        description: `Recommended automatically by Kura AI based on ingredients in your kitchen cabinet.`,
        time: data.time || "20 mins",
        calories: 0,
        servings: "2",
        difficulty: "Easy",
        protein: "0g",
        fat: "0g",
        carbs: "0g",
        matchScore: 100,
        category: "AI Smart Choice",
        fullIngredients: (data.ingredients || []).map((ing: any) => ({
          name: ing.name || '',
          quantity: ing.quantity || ''
        })),
        instructions: data.instructions || [],
        isUserCreated: true,
        isAiSuggested: true,
        userId: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (userId) {
        await setDoc(doc(db, `users/${userId}/recipes`, recipeId), recipeDoc);
      }

      // Go directly to recipe detail view!
      onSelectRecipe(recipeId);
      onViewChange('recipe-detail');
      
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Failed to contact Gemini kitchen experts.");
    } finally {
      setIsAiLoading(false);
    }
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
      className="pb-40 px-6 pt-24 max-w-lg mx-auto relative font-sans text-black"
    >
      <header className="mb-8">
        <h1 className="text-4xl font-light mb-6 tracking-tight text-ink-black select-none">My Personal Cookbook</h1>

        {aiError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 text-red-750 text-xs border border-red-200/50 flex gap-2 items-center">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="font-semibold leading-relaxed">{aiError}</p>
          </div>
        )}

        {/* 2-Column Banner Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Create Your Own Recipe Banner */}
          <div 
            onClick={() => onViewChange('add-recipe')}
            className="bg-ink-black text-white p-6 rounded-[24px] border border-zinc-900 flex flex-col justify-between hover:bg-zinc-850 duration-250 transition-all cursor-pointer shadow-sm group min-h-[170px]"
            id="create-recipe-banner"
          >
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1 block">Notebook draft</span>
              <h2 className="text-lg font-light tracking-tight mb-2">Create Custom Recipe</h2>
              <p className="text-[11px] text-zinc-400 font-light leading-snug">
                Write names & instructions manually to archive your personal kitchen secrets.
              </p>
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-white">
              <span>Begin Scribing</span>
              <Plus className="w-3.5 h-3.5 text-white stroke-[2.5px]" />
            </div>
          </div>

          {/* AI Recipe suggestion Banner */}
          <button 
            disabled={isAiLoading || remainingRecipes <= 0}
            onClick={generateAiRecipe}
            className={`text-left p-6 rounded-[24px] border transition-all flex flex-col justify-between min-h-[170px] ${
              remainingRecipes <= 0 
                ? 'bg-zinc-50 border-zinc-200 text-zinc-400 cursor-not-allowed opacity-60 shadow-none'
                : 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700 cursor-pointer shadow group'
            }`}
          >
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className={`text-[9px] font-bold uppercase tracking-[0.2em] block ${remainingRecipes <= 0 ? 'text-zinc-400' : 'text-indigo-200'}`}>Gemini Smart</span>
                <span className={`text-[8px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${remainingRecipes <= 0 ? 'bg-zinc-200 text-zinc-500' : 'bg-white/10 text-indigo-100'}`}>
                   {remainingRecipes} Left today
                </span>
              </div>
              <h2 className={`text-lg font-light tracking-tight mb-2 ${remainingRecipes <= 0 ? 'text-zinc-500' : 'text-white'}`}>AI Smart Suggest</h2>
              <p className={`text-[11px] font-light leading-snug ${remainingRecipes <= 0 ? 'text-zinc-400' : 'text-indigo-100'}`}>
                {isAiLoading
                  ? 'Consulting kitchen experts in Gemini...'
                  : 'AI automatically crafts a delicious home recipe optimized precisely for your active cabinet ingredients.'}
              </p>
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest">
              {isAiLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Suggesting Recipe...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate AI Recommendation</span>
                </>
              )}
            </div>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5 transition-colors group-focus-within:text-ink-black" />
          <input 
            type="text" 
            placeholder="Search my custom cookbook..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-0 focus:border-zinc-350 outline-none transition-all placeholder:text-zinc-400 text-sm font-light text-ink-black"
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
                  : 'bg-white text-zinc-400 border-zinc-100 hover:border-zinc-350'
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
          <div className="py-24 text-center bg-zinc-50/50 rounded-[32px] border border-dashed border-zinc-200">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100 shadow-sm">
              <BookOpen className="w-5 h-5 text-zinc-300" />
            </div>
            <p className="text-zinc-400 text-xs font-light italic">No recipes in cookbook.</p>
            <button
              onClick={() => onViewChange('add-recipe')}
              className="mt-4 px-5 py-2.5 bg-ink-black text-white text-[9px] font-bold uppercase tracking-widest rounded-full hover:bg-zinc-850 transition-colors"
            >
              Write First Recipe
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
      className="p-5 bg-white border border-zinc-200 dark:border-zinc-800 rounded-2xl group cursor-pointer transition-all hover:bg-zinc-50/80 dark:hover:bg-zinc-800 relative hover:shadow-md flex flex-col gap-4 justify-between h-56 shadow-sm"
    >
      <div className="relative">
        <div className="flex items-center justify-between gap-2 mb-2">
          {recipe.isAiSuggested ? (
            <span className="bg-indigo-600 text-white text-[9px] tracking-widest font-bold px-2 py-0.5 rounded uppercase shrink-0 flex items-center gap-1 shadow-sm">
              <Sparkles className="w-2.5 h-2.5 animate-pulse text-amber-300" /> AI Spark
            </span>
          ) : (
            <span className="bg-ink-black text-white dark:bg-white dark:text-black text-[9px] tracking-widest font-bold px-2 py-0.5 rounded uppercase shrink-0">
              Handmade
            </span>
          )}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDeleteRecipe(recipe.id);
            }}
            className="w-7 h-7 bg-zinc-55 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-zinc-400 hover:text-red-500 rounded-full flex items-center justify-center border border-zinc-150 dark:border-zinc-700 transition-all"
            title="Delete custom recipe"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <h3 className="text-sm font-bold text-ink-black leading-tight line-clamp-3 mt-1 text-black">
          {recipe.name}
        </h3>
        <p className="text-[9px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-bold mt-1.5">
          {recipe.category || 'Kitchen Notebook'}
        </p>
      </div>

      <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-3 mt-auto">
        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-zinc-400" />
          {recipe.time || '15 mins'}
        </span>
      </div>
    </div>
  );
}
