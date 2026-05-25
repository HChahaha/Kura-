import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Camera, Plus, X, List, Clock, ChefHat, Sparkles } from 'lucide-react';
import { View } from '../types';

interface AddRecipeProps {
  onViewChange: (view: View) => void;
  onSaveRecipe: (recipe: any) => void;
}

export default function AddRecipe({ onViewChange, onSaveRecipe }: AddRecipeProps) {
  const [name, setName] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState<{ id: string; name: string; quantity: string }[]>([
    { id: '1', name: '', quantity: '' }
  ]);
  const [steps, setSteps] = useState([{ id: '1', text: '' }]);
  const [prepTime, setPrepTime] = useState('20');
  const [calories, setCalories] = useState('450');
  const [servings, setServings] = useState('2');
  const [difficulty, setDifficulty] = useState('Easy');
  const [protein, setProtein] = useState('20g');
  const [fat, setFat] = useState('10g');
  const [carbs, setCarbs] = useState('40g');

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
      id: Math.random().toString(36).substring(7),
      name: finalName,
      image: image || "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=800",
      description: description || "A personal culinary record.",
      time: `${prepTime} min`,
      calories: parseInt(calories) || 0,
      servings: servings || '1',
      difficulty: difficulty || 'Easy',
      protein: protein || '0g',
      fat: fat || '0g',
      carbs: carbs || '0g',
      matchScore: 100, // Own recipes always match what you intended
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
      className="pb-40 min-h-screen bg-white"
    >
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-6 py-6 border-b border-zinc-100 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => onViewChange('recipes')} className="p-2 -ml-2 text-zinc-400 hover:text-ink-black transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-300 block mb-0.5">Scrapbook</span>
            <h1 className="text-xl font-light text-ink-black">New Creation</h1>
          </div>
        </div>
        <button 
          onClick={handleSave}
          className="text-[10px] font-bold uppercase tracking-[0.3em] text-bamboo-green hover:opacity-70 transition-all px-4 py-2 bg-bamboo-green/5 rounded-full"
        >
          Publish
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-6 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Visual Column */}
          <div className="lg:col-span-5 space-y-12">
            <div className="relative aspect-[3/4] bg-washi-gray rounded-[24px] overflow-hidden group">
              {image ? (
                <img src={image} className="w-full h-full object-cover" alt="Recipe Preview" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500">
                    <Camera className="w-6 h-6 text-zinc-300" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 leading-relaxed">
                    A beautiful meal deserves a beautiful record.
                  </p>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setImage(URL.createObjectURL(file));
                }}
              />
              {image && (
                <button 
                  onClick={() => setImage(null)}
                  className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/10 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="space-y-8 p-8 bg-zinc-50/50 rounded-[24px]">
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Details</span>
                 <Sparkles className="w-3 h-3 text-bamboo-green" />
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-300 block mb-2">Time (min)</label>
                  <input 
                    type="number" 
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    className="w-full bg-transparent text-xl font-light text-ink-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-300 block mb-2">Calories (kcal)</label>
                  <input 
                    type="number" 
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    className="w-full bg-transparent text-xl font-light text-ink-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-4 border-t border-zinc-100">
                <div>
                  <label className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-300 block mb-2">Servings</label>
                  <input 
                    type="number" 
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    className="w-full bg-transparent text-xl font-light text-ink-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-300 block mb-2">Difficulty</label>
                  <select 
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-transparent text-sm font-light text-ink-black focus:outline-none border-none p-0 outline-none select-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100">
                <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-300 block mb-4">Macronutrients</span>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-300 block mb-2">Protein</label>
                    <input 
                      type="text" 
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                      placeholder="e.g. 20g"
                      className="w-full bg-transparent text-sm font-medium text-ink-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-300 block mb-2">Fat</label>
                    <input 
                      type="text" 
                      value={fat}
                      onChange={(e) => setFat(e.target.value)}
                      placeholder="e.g. 10g"
                      className="w-full bg-transparent text-sm font-medium text-ink-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-300 block mb-2">Carbs</label>
                    <input 
                      type="text" 
                      value={carbs}
                      onChange={(e) => setCarbs(e.target.value)}
                      placeholder="e.g. 40g"
                      className="w-full bg-transparent text-sm font-medium text-ink-black focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Column */}
          <div className="lg:col-span-7 space-y-16">
            <section>
              <input 
                type="text"
                placeholder="Title your creation..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-5xl font-light text-ink-black placeholder:text-zinc-100 focus:outline-none bg-transparent mb-8"
              />
              <textarea 
                placeholder="A brief story about this dish..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-32 text-xl font-light italic text-zinc-400 placeholder:text-zinc-100 focus:outline-none bg-transparent resize-none leading-relaxed"
              />
            </section>

            <section>
              <div className="flex justify-between items-center mb-8 border-b border-zinc-100 pb-4">
                <div className="flex items-center gap-3">
                  <List className="w-4 h-4 text-zinc-300" />
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-ink-black">Ingredients</h3>
                </div>
                <button onClick={addIngredient} className="text-zinc-300 hover:text-bamboo-green transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-6">
                {ingredients.map((ing) => (
                  <div key={ing.id} className="flex gap-4 group">
                    <input 
                      type="text"
                      placeholder="Ingredient name"
                      value={ing.name}
                      onChange={(e) => updateIngredient(ing.id, 'name', e.target.value)}
                      className="flex-1 text-sm font-medium text-ink-black placeholder:text-zinc-200 focus:outline-none bg-transparent"
                    />
                    <input 
                      type="text"
                      placeholder="e.g. 200g"
                      value={ing.quantity}
                      onChange={(e) => updateIngredient(ing.id, 'quantity', e.target.value)}
                      className="w-24 text-[10px] font-bold text-zinc-300 placeholder:text-zinc-100 focus:outline-none bg-transparent uppercase tracking-wider"
                    />
                    <button 
                      onClick={() => removeIngredient(ing.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-zinc-200 hover:text-red-400 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="flex justify-between items-center mb-8 border-b border-zinc-100 pb-4">
                <div className="flex items-center gap-3">
                  <ChefHat className="w-4 h-4 text-zinc-300" />
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-ink-black">Instructions</h3>
                </div>
                <button onClick={addStep} className="text-zinc-300 hover:text-bamboo-green transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-12">
                {steps.map((step, idx) => (
                  <div key={step.id} className="relative group">
                    <span className="absolute -left-12 top-0 text-[10px] font-bold text-zinc-200 uppercase tracking-widest leading-relaxed">Step {idx + 1}</span>
                    <div className="flex gap-4 items-start">
                      <textarea 
                        placeholder="Describe the process..."
                        value={step.text}
                        onChange={(e) => updateStep(step.id, e.target.value)}
                        className="flex-1 text-base font-light font-sans leading-relaxed text-zinc-600 placeholder:text-zinc-100 focus:outline-none bg-transparent resize-none h-20"
                      />
                      <button 
                        onClick={() => removeStep(step.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-zinc-200 hover:text-red-400 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Fixed Action Button */}
      <div className="fixed bottom-10 left-6 right-6 md:left-auto md:right-10 md:w-80 z-[60]">
        <button 
          onClick={handleSave}
          className="w-full h-16 bg-ink-black text-white rounded-full flex items-center justify-center gap-4 shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all group"
        >
          <div className="flex flex-col items-start">
             <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 leading-none mb-1">Scrapbook</span>
             <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-white">Publish Record</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-bamboo-green transition-colors">
            <Sparkles className="w-5 h-5 text-bamboo-green group-hover:text-white transition-colors" />
          </div>
        </button>
      </div>
    </motion.div>
  );
}
