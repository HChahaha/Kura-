import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Plus, X, List, ChefHat, Sparkles } from 'lucide-react';
import { View } from '../types';

interface AddRecipeProps {
  onViewChange: (view: View) => void;
  onSaveRecipe: (recipe: any) => void;
  recipeToEdit?: any;
}

export default function AddRecipe({ onViewChange, onSaveRecipe, recipeToEdit }: AddRecipeProps) {
  const [name, setName] = useState(recipeToEdit?.name || '');
  
  const initialIngredients = recipeToEdit?.fullIngredients?.length 
    ? recipeToEdit.fullIngredients.map((i: any) => ({ ...i, id: Math.random().toString(36).substring(7) }))
    : [{ id: '1', name: '', quantity: '' }];
  const [ingredients, setIngredients] = useState<{ id: string; name: string; quantity: string }[]>(initialIngredients);
  
  const initialSteps = recipeToEdit?.instructions?.length
    ? recipeToEdit.instructions.map((text: string) => ({ id: Math.random().toString(36).substring(7), text }))
    : [{ id: '1', text: '' }];
  const [steps, setSteps] = useState(initialSteps);

  const addIngredient = () => {
    setIngredients(prev => [...prev, { id: Math.random().toString(36).substring(7), name: '', quantity: '' }]);
  };

  const updateIngredient = (id: string, field: 'name' | 'quantity', value: string) => {
    setIngredients(prev => prev.map(ing => ing.id === id ? { ...ing, [field]: value } : ing));
  };

  const removeIngredient = (id: string) => {
    setIngredients(prev => prev.filter(ing => ing.id !== id));
  };

  const addStep = () => {
    setSteps(prev => [...prev, { id: Math.random().toString(36).substring(7), text: '' }]);
  };

  const updateStep = (id: string, value: string) => {
    setSteps(prev => prev.map(step => step.id === id ? { ...step, text: value } : step));
  };

  const removeStep = (id: string) => {
    setSteps(prev => prev.filter(step => step.id !== id));
  };

  const handleSave = () => {
    const finalName = name.trim() || `Untitled Creation ${new Date().toLocaleDateString()}`;
    
    onSaveRecipe({
      id: recipeToEdit?.id || Math.random().toString(36).substring(7),
      name: finalName,
      image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=800",
      description: "A hand-made kitchen record.",
      time: "20 min",
      calories: 0,
      servings: '1',
      difficulty: 'Easy',
      protein: '0g',
      fat: '0g',
      carbs: '0g',
      matchScore: 100, 
      category: 'My Creations',
      fullIngredients: ingredients.filter(i => i.name).map(ing => ({ name: ing.name, quantity: ing.quantity })),
      instructions: steps.filter(s => s.text).map(s => s.text),
      isUserCreated: true
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-40 min-h-screen bg-white font-sans text-black"
    >
      {/* Slick Clean Header */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md px-6 py-6 border-b border-zinc-100 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => onViewChange('recipes')} className="p-2 -ml-2 text-zinc-400 hover:text-ink-black transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 block mb-0.5">Notebook</span>
            <h1 className="text-xl font-light text-ink-black">{recipeToEdit ? 'Edit Custom Recipe' : 'Write Custom Recipe'}</h1>
          </div>
        </div>
        <div>
          <button 
            onClick={handleSave}
            className="text-[10px] font-bold uppercase tracking-[0.3em] text-bamboo-green hover:opacity-75 transition-all px-4 py-2 bg-bamboo-green/5 rounded-full"
          >
            {recipeToEdit ? 'Save Changes' : 'Publish Recipe'}
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 pt-12 space-y-16">
        {/* Title input */}
        <section className="space-y-4">
          <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 block">Recipe Title</label>
          <input 
            type="text"
            placeholder="e.g. Grandma's Famous Apple Tart"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-4xl font-light text-ink-black placeholder:text-zinc-200 focus:outline-none bg-transparent border-b border-zinc-100 pb-3 hover:border-zinc-300 focus:border-ink-black transition-all"
          />
        </section>

        {/* Ingredients list */}
        <section className="space-y-6">
          <div className="flex justify-between items-center border-b border-zinc-100 pb-4">
            <div className="flex items-center gap-3">
              <List className="w-4 h-4 text-zinc-400" />
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-ink-black">Ingredients List</h3>
            </div>
            <button 
              onClick={addIngredient} 
              className="px-3 py-1.5 bg-zinc-50 hover:bg-zinc-100 text-ink-black text-[9px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Ingredient
            </button>
          </div>
          <div className="space-y-4">
            {ingredients.map((ing, idx) => (
              <div key={ing.id} className="flex gap-4 items-center group">
                <span className="text-[10px] font-extrabold text-zinc-300 w-6">#{idx + 1}</span>
                <input 
                  type="text"
                  placeholder="Ingredient name (e.g., Unsalted Butter)"
                  value={ing.name}
                  onChange={(e) => updateIngredient(ing.id, 'name', e.target.value)}
                  className="flex-1 text-sm font-semibold text-ink-black placeholder:text-zinc-200 focus:outline-none bg-transparent border-b border-transparent hover:border-zinc-100 focus:border-ink-black pb-1.5 transition-colors"
                />
                <input 
                  type="text"
                  placeholder="Quantity (e.g., 2 tbsp)"
                  value={ing.quantity}
                  onChange={(e) => updateIngredient(ing.id, 'quantity', e.target.value)}
                  className="w-36 text-xs text-zinc-500 placeholder:text-zinc-250 focus:outline-none bg-transparent border-b border-transparent hover:border-zinc-100 focus:border-ink-black pb-1.5 transition-colors"
                />
                <button 
                  onClick={() => removeIngredient(ing.id)}
                  className="p-1 px-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                  title="Remove ingredient line"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Steps section */}
        <section className="space-y-8">
          <div className="flex justify-between items-center border-b border-zinc-100 pb-4">
            <div className="flex items-center gap-3">
              <ChefHat className="w-4 h-4 text-zinc-400" />
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-ink-black">Cooking Steps</h3>
            </div>
            <button 
              onClick={addStep} 
              className="px-3 py-1.5 bg-zinc-50 hover:bg-zinc-100 text-ink-black text-[9px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Step
            </button>
          </div>
          <div className="space-y-8">
            {steps.map((step, idx) => (
              <div key={step.id} className="relative group flex gap-4 items-start">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed pt-1 w-16">Step {idx + 1}</span>
                <textarea 
                  placeholder="Describe your process clearly..."
                  value={step.text}
                  onChange={(e) => updateStep(step.id, e.target.value)}
                  className="flex-1 text-sm font-normal font-sans leading-relaxed text-zinc-700 placeholder:text-zinc-200 focus:outline-none bg-transparent border-b border-dashed border-zinc-100 focus:border-sink-black pb-3 resize-none h-16 transition-colors"
                />
                <button 
                  onClick={() => removeStep(step.id)}
                  className="p-1 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                  title="Remove step"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Big Save Button at bottom */}
        <div className="pt-10 flex justify-end">
          <button 
            onClick={handleSave}
            className="px-8 py-4 bg-ink-black hover:bg-zinc-800 text-white font-bold rounded-2xl uppercase tracking-widest text-xs flex items-center gap-3 shadow-lg active:scale-95 transition-all"
          >
            <span>Publish Recipe</span>
            <Sparkles className="w-4 h-4 text-bamboo-green" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
