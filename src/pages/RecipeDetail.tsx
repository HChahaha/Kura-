import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Clock, Users, Flame, Dumbbell, Droplets, Wheat, CheckCircle2, AlertCircle, Heart, Share2, Circle, X, Play } from 'lucide-react';
import { RECIPES } from '../constants';
import { View, InventoryItem, Recipe } from '../types';
import { getRecipeById, calculateMatchScore } from '../services/recipeService';

interface RecipeDetailProps {
  id: string | null;
  inventory: InventoryItem[];
  lastAddedIngredient: string | null;
  onViewChange: (view: View) => void;
  onAddToShoppingList: (items: string[]) => void;
  onUpdateInventory: (items: any) => void;
  customRecipes: any[];
  savedRecipeIds?: string[];
  onToggleSaveRecipe?: (id: string) => void;
}

export default function RecipeDetail({ 
  id, 
  inventory, 
  lastAddedIngredient, 
  onViewChange, 
  onAddToShoppingList, 
  onUpdateInventory, 
  customRecipes,
  savedRecipeIds = [],
  onToggleSaveRecipe
}: RecipeDetailProps) {
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [cookingMode, setCookingMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Find recipe. If not in RECIPES, it might be in customRecipes, or an external fallback.
  const recipe = useMemo(() => {
    // Check custom user recipes first
    const customFound = customRecipes.find(r => r.id === id);
    if (customFound) return customFound;

    const found = RECIPES.find(r => r.id === id);
    if (found) return found;
    
    if (id) {
      const external = getRecipeById(id);
      if (external) {
        return {
          ...external,
          matchScore: calculateMatchScore(external, inventory)
        } as Recipe;
      }
    }
    
    return null; 
  }, [id, inventory, customRecipes]);

  const isSaved = useMemo(() => {
    if (!recipe) return false;
    return savedRecipeIds.includes(recipe.id);
  }, [recipe, savedRecipeIds]);

  // Calculate ingredient statuses based on real inventory
  const processedIngredients = useMemo(() => {
    if (!recipe) return [];
    return recipe.fullIngredients?.map(ing => {
      const inventoryMatch = inventory.find(item => 
        item.name.toLowerCase().includes(ing.name.toLowerCase()) || 
        ing.name.toLowerCase().includes(item.name.toLowerCase())
      );
      
      let status: 'IN STOCK' | 'LOW STOCK' | 'OUT OF STOCK' = 'OUT OF STOCK';
      if (inventoryMatch) {
         status = inventoryMatch.daysLeft !== undefined && inventoryMatch.daysLeft <= 2 ? 'LOW STOCK' : 'IN STOCK';
      }
      
      return { ...ing, inStock: status };
    }) || [];
  }, [recipe, inventory]);

  const baseServings = parseInt(recipe?.servings || '1') || 1;
  const [servings, setServings] = useState(1);

  // Sync servings with recipe when recipe is loaded
  React.useEffect(() => {
    if (recipe) {
      setServings(parseInt(recipe.servings || '1') || 1);
    }
  }, [recipe]);

  if (!recipe) {
     return (
       <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-white">
          <p className="text-zinc-400 mb-8 font-light italic">Looking for recipe details in the scrapbook...</p>
          <button onClick={() => onViewChange('recipes')} className="text-ink-black underline font-bold uppercase tracking-widest text-[10px]">Back to Discovery</button>
       </div>
     );
  }

  const scaleFactor = servings / baseServings;

  const scaleQuantity = (qty: any) => {
    if (qty === undefined || qty === null || qty === '') return '0g';
    const qtyStr = String(qty);
    // Basic regex to find numbers and scale them
    return qtyStr.replace(/([0-9.]+)/g, (match) => {
      const num = parseFloat(match);
      if (isNaN(num)) return match;
      const scaled = num * scaleFactor;
      // Round to 1 decimal place if needed
      return scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1);
    });
  };

  const handleFinishCooking = () => {
    onViewChange('recipes');
  };

  const addMissingToShopping = () => {
    const missing = processedIngredients?.filter(i => i.inStock === 'OUT OF STOCK').map(i => i.name) || [];
    if (missing.length > 0) {
      onAddToShoppingList(missing);
    }
  };

  const toggleIngredient = (idx: number) => {
    setCheckedIngredients(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (cookingMode) {
    const totalSteps = recipe.instructions?.length || 0;
    const progress = ((currentStep + 1) / totalSteps) * 100;
    const stepText = recipe.instructions?.[currentStep] || '';
    const [title, ...descParts] = stepText.includes(':') ? stepText.split(':') : [`Step ${currentStep + 1}`, stepText];
    const description = descParts.join(':').trim();

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[100] bg-white flex flex-col font-sans"
      >
        <header className="px-6 py-6 border-b border-zinc-100 flex justify-between items-center bg-white/80 backdrop-blur-md">
          <button onClick={() => setCookingMode(false)} className="text-zinc-400 hover:text-ink-black transition-colors">
            <X className="w-6 h-6" />
          </button>
          <div className="text-center font-sans">
            <h2 className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-300">Cooking {recipe.name}</h2>
            <p className="text-xs font-bold text-ink-black">Step {currentStep + 1} of {totalSteps}</p>
          </div>
          <div className="w-6" />
        </header>

        <div className="flex-1 px-10 flex flex-col justify-center items-center text-center space-y-12">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
             <span className="text-[120px] font-light text-zinc-100 italic leading-none select-none">0{currentStep + 1}</span>
             <h3 className="text-4xl font-medium text-ink-black tracking-tighter max-w-md mx-auto">{title}</h3>
             <p className="text-xl leading-relaxed text-zinc-500 font-light max-w-lg mx-auto italic">
                "{description}"
             </p>
          </motion.div>
        </div>

        <div className="p-8 space-y-8 bg-zinc-50/50">
          <div className="h-[2px] w-full bg-zinc-100 rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${progress}%` }}
               className="h-full bg-ink-black transition-all duration-500"
             />
          </div>

          <div className="flex gap-4">
             <button 
               onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
               disabled={currentStep === 0}
               className="flex-1 py-5 border border-zinc-100 rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-400 disabled:opacity-20 hover:border-zinc-300 transition-all font-sans"
             >
               Previous
             </button>
             {currentStep < totalSteps - 1 ? (
               <button 
                 onClick={() => setCurrentStep(prev => prev + 1)}
                 className="flex-[2] py-5 bg-ink-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:opacity-90 shadow-xl transition-all font-sans"
               >
                 Next Step
               </button>
             ) : (
               <button 
                 onClick={() => {
                   setCookingMode(false);
                   handleFinishCooking();
                 }}
                 className="flex-[2] py-5 bg-bamboo-green text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:opacity-90 shadow-xl transition-all font-sans"
               >
                 Complete Recipe
               </button>
             )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-64 min-h-screen bg-white relative font-sans"
    >
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-6 bg-white/5 backdrop-blur-md transition-all">
        <button onClick={() => onViewChange('recipes')} className="text-ink-black hover:opacity-70 transition-opacity">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-light tracking-[0.4em] uppercase text-ink-black">Kura</h1>
        <div className="flex items-center gap-4">
          {recipe.fullIngredients && (
            <div className="flex flex-col items-end justify-center">
               <span className="text-[8px] font-bold text-ink-black/40 uppercase tracking-widest">Inventory Match</span>
               <span className="text-xs font-bold text-bamboo-green">
                 {Math.round((recipe.matchScore || 0) / 100 * recipe.fullIngredients.length)}/{recipe.fullIngredients.length} Items Match
               </span>
            </div>
          )}
          
          {onToggleSaveRecipe && (
            <button 
              onClick={() => onToggleSaveRecipe(recipe.id)}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/40 hover:bg-white border border-zinc-100 shadow-sm text-zinc-400 hover:text-red-500 transition-all active:scale-95"
              title={isSaved ? "Remove from saved recipes" : "Save recipe"}
            >
              <Heart className={`w-4 h-4 transition-transform ${isSaved ? 'text-red-500 fill-red-500 scale-110' : 'text-zinc-400'}`} />
            </button>
          )}
        </div>
      </header>

      <div className="relative h-[65vh] w-full pt-16">
        <img 
          src={recipe.image || 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=800'} 
          alt={recipe.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        <div className="absolute bottom-12 left-6 right-6 text-white text-shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] mb-3 block opacity-90">
            {recipe.tags?.[0] || 'JAPANESE FUSION'}
          </span>
          <h2 className="text-4xl font-medium leading-tight mb-8 max-w-[80%]">
            {recipe.name}
          </h2>
          <div className="flex flex-wrap gap-y-4 gap-x-8 text-[11px] font-bold uppercase tracking-widest opacity-90">
            <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-white/50" /> {recipe.time || '15 mins'}</div>
            <div className="flex items-center gap-2"><Flame className="w-4 h-4 text-white/50" /> {recipe.calories ? Math.round(recipe.calories * scaleFactor) : '0'} kcal</div>
            <div className="flex items-center gap-2"><Dumbbell className="w-4 h-4 text-white/50" /> {recipe.difficulty || 'Medium'}</div>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
              <Users className="w-4 h-4 text-white/50" /> 
              <button 
                onClick={(e) => { e.stopPropagation(); setServings(Math.max(1, servings - 1)); }}
                className="hover:scale-125 transition-transform px-1"
              >-</button>
              <span className="mx-1">{servings} pers</span>
              <button 
                onClick={(e) => { e.stopPropagation(); setServings(servings + 1); }}
                className="hover:scale-125 transition-transform px-1"
              >+</button>
            </div>
          </div>
          
          <div className="mt-8 flex gap-3 overflow-x-auto no-scrollbar scroll-smooth">
            <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl px-5 py-3 min-w-[90px] flex flex-col gap-1">
              <span className="text-[9px] font-bold tracking-[0.2em] text-white/40">PRO</span>
              <span className="text-sm font-medium">{scaleQuantity(recipe.protein)}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl px-5 py-3 min-w-[90px] flex flex-col gap-1">
              <span className="text-[9px] font-bold tracking-[0.2em] text-white/40">FAT</span>
              <span className="text-sm font-medium">{scaleQuantity(recipe.fat)}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl px-5 py-3 min-w-[90px] flex flex-col gap-1">
              <span className="text-[9px] font-bold tracking-[0.2em] text-white/40">CARB</span>
              <span className="text-sm font-medium">{scaleQuantity(recipe.carbs)}</span>
            </div>
            {recipe.videoUrl && (
              <a 
                href={recipe.videoUrl} 
                target="_blank" 
                rel="noreferrer"
                className="bg-ink-black/20 backdrop-blur-lg border border-white/20 rounded-2xl px-5 py-3 min-w-[120px] flex items-center gap-3 transition-colors hover:bg-ink-black/40"
              >
                <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center">
                  <Play className="w-3 h-3 text-ink-black fill-ink-black" />
                </div>
                <span className="text-[9px] font-bold tracking-[0.2em]">WATCH VIDEO</span>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-16 -mt-8 bg-white rounded-t-[40px] relative z-10 shadow-2xl">
        <section className="mb-20">
          <h2 className="text-3xl font-light mb-12 text-ink-black">Ingredients</h2>
          <div className="bg-[#F9F9F9] border border-zinc-100/50 rounded-[24px] p-4">
            {processedIngredients?.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => toggleIngredient(idx)}
                className={`flex items-center justify-between p-6 border-b border-zinc-100 last:border-0 cursor-pointer transition-all ${checkedIngredients[idx] ? 'opacity-40' : 'opacity-100'}`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-all ${
                    checkedIngredients[idx] ? 'bg-ink-black border-ink-black' : 'border-zinc-200 bg-white'
                  }`}>
                    {checkedIngredients[idx] && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-base font-medium font-sans ${checkedIngredients[idx] ? 'text-zinc-400 line-through' : 'text-zinc-600'}`}>
                    <span className="opacity-40 mr-2">{scaleQuantity(item.quantity)}</span>
                    <span className={lastAddedIngredient && item.name.toLowerCase().includes(lastAddedIngredient.toLowerCase()) ? 'text-bamboo-green underline underline-offset-4 decoration-2' : ''}>
                      {item.name}
                    </span>
                  </span>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${
                  checkedIngredients[idx] ? 'text-zinc-400 bg-zinc-100' :
                  item.inStock === 'IN STOCK' ? 'text-bamboo-green bg-[#E8F5E9]/50' : 
                  item.inStock === 'LOW STOCK' ? 'text-orange-400 bg-[#FFF3E0]/50' : 
                  'text-zinc-300 bg-zinc-100'
                }`}>
                  {checkedIngredients[idx] ? 'CHECKED' : item.inStock}
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 mt-10">
            <button 
              onClick={addMissingToShopping}
              className="w-full py-5 border border-zinc-200 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-ink-black hover:border-zinc-400 transition-all font-sans"
            >
              ADD MISSING TO LIST
            </button>
          </div>
        </section>

        <section className="mb-24 px-2">
          <div className="flex items-center gap-6 mb-16">
            <h2 className="text-3xl font-light text-ink-black">Preparation</h2>
            <div className="h-[1px] flex-1 bg-zinc-100" />
            <button 
              onClick={() => {
                setCookingMode(true);
                setCurrentStep(0);
              }}
              className="px-5 py-2.5 bg-ink-black/5 text-zinc-400 rounded-full text-[8px] font-bold uppercase tracking-widest hover:bg-ink-black hover:text-white transition-all font-sans"
            >
              Guide
            </button>
          </div>
          <div className="space-y-24">
            {recipe.instructions?.map((step, idx) => {
              const [title, ...descParts] = step.includes(':') ? step.split(':') : [`Step ${idx + 1}`, step];
              const description = descParts.join(':').trim();
              return (
                <div key={idx} className="flex gap-10 group">
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-14 h-14 rounded-full border border-zinc-100 flex items-center justify-center shrink-0 text-xs font-bold text-zinc-300 bg-white transition-all group-hover:scale-110 group-hover:border-zinc-300 shadow-sm">
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <h3 className="text-2xl font-medium text-ink-black tracking-tight">{title}</h3>
                    <p className="text-lg leading-relaxed text-zinc-500 font-light font-sans">
                      {description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="fixed bottom-28 left-6 right-6 z-40">
          <button 
            onClick={handleFinishCooking}
            className="w-full bg-[#1A1A1A] text-white py-6 rounded-2xl flex items-center justify-center gap-4 font-bold uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-black hover:text-black" />
            </div>
            FINISH COOKING
          </button>
        </div>
      </div>
    </motion.div>
  );
}
