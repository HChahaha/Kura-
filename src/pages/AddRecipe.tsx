import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Camera, Plus, X, List, Clock, ChefHat, Sparkles, Brain, Link, Image as ImageIcon, Loader2 } from 'lucide-react';
import { View } from '../types';

interface AddRecipeProps {
  onViewChange: (view: View) => void;
  onSaveRecipe: (recipe: any) => void;
  recipeToEdit?: any;
}

export default function AddRecipe({ onViewChange, onSaveRecipe, recipeToEdit }: AddRecipeProps) {
  const [name, setName] = useState(recipeToEdit?.name || '');
  const [image, setImage] = useState<string | null>(recipeToEdit?.image || null);
  const [description, setDescription] = useState(recipeToEdit?.description || '');
  
  const initialIngredients = recipeToEdit?.fullIngredients?.length 
    ? recipeToEdit.fullIngredients.map((i: any) => ({ ...i, id: Math.random().toString(36).substring(7) }))
    : [{ id: '1', name: '', quantity: '' }];
  const [ingredients, setIngredients] = useState<{ id: string; name: string; quantity: string }[]>(initialIngredients);
  
  const initialSteps = recipeToEdit?.instructions?.length
    ? recipeToEdit.instructions.map((text: string) => ({ id: Math.random().toString(36).substring(7), text }))
    : [{ id: '1', text: '' }];
  const [steps, setSteps] = useState(initialSteps);
  
  const [prepTime, setPrepTime] = useState(recipeToEdit?.time?.replace(/\D/g, '') || '20');
  const [calories, setCalories] = useState(recipeToEdit?.calories?.toString() || '450');
  const [servings, setServings] = useState(recipeToEdit?.servings || '2');
  const [difficulty, setDifficulty] = useState(recipeToEdit?.difficulty || 'Easy');
  const [protein, setProtein] = useState(recipeToEdit?.protein || '20g');
  const [fat, setFat] = useState(recipeToEdit?.fat || '10g');
  const [carbs, setCarbs] = useState(recipeToEdit?.carbs || '40g');

  // AI Import State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiUrl, setAiUrl] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const parseAiRecipe = async (type: 'url' | 'image', payload: { url?: string; file?: File }) => {
    setIsAiLoading(true);
    setAiError('');
    try {
      let requestBody: any = { inputType: type };
      
      if (type === 'url' && payload.url) {
        requestBody.url = payload.url;
      } else if (type === 'image' && payload.file) {
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(payload.file!);
        });
        requestBody.imageData = base64Data;
        requestBody.mimeType = payload.file.type;
      }

      const res = await fetch('/api/parse-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to parse recipe');
      }

      const data = await res.json();
      
      if (data?.title) setName(data.title);
      if (data?.time) {
        const timeStr = String(data.time).replace(/\D/g, '');
        setPrepTime(timeStr || String(data.time));
      }
      if (data?.calories) setCalories(String(data.calories));
      if (data?.difficulty) setDifficulty(data.difficulty);
      if (data?.servings) setServings(String(data.servings));
      
      if (data?.ingredients && Array.isArray(data.ingredients)) {
        setIngredients(data.ingredients.map((ing: any) => ({
          id: Math.random().toString(36).substring(7),
          name: ing?.name || '',
          quantity: String(ing?.quantity || '')
        })));
      }
      
      if (data?.instructions && Array.isArray(data.instructions)) {
        setSteps(data.instructions.map((step: any) => ({
          id: Math.random().toString(36).substring(7),
          text: String(step?.text || step || '')
        })));
      }

      setIsAiModalOpen(false);
    } catch (err: any) {
      setAiError(err.message || 'An error occurred during parsing.');
    } finally {
      setIsAiLoading(false);
    }
  };

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
            <h1 className="text-xl font-light text-ink-black">{recipeToEdit ? 'Edit Creation' : 'New Creation'}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-500 hover:opacity-70 transition-all px-4 py-2 bg-indigo-50 rounded-full"
          >
            <Brain className="w-3.5 h-3.5" /> AI Import
          </button>
          <button 
            onClick={handleSave}
            className="text-[10px] font-bold uppercase tracking-[0.3em] text-bamboo-green hover:opacity-70 transition-all px-4 py-2 bg-bamboo-green/5 rounded-full"
          >
            {recipeToEdit ? 'Save Changes' : 'Publish'}
          </button>
        </div>
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
             <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-white">{recipeToEdit ? 'Save Updates' : 'Publish Record'}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-bamboo-green transition-colors">
            <Sparkles className="w-5 h-5 text-bamboo-green group-hover:text-white transition-colors" />
          </div>
        </button>
      </div>

      <AnimatePresence>
        {isAiModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isAiLoading && setIsAiModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-[24px] shadow-2xl overflow-hidden p-8"
            >
              <button 
                onClick={() => !isAiLoading && setIsAiModalOpen(false)}
                className="absolute top-6 right-6 text-zinc-400 hover:text-ink-black transition-colors"
                disabled={isAiLoading}
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 mb-2">
                <Brain className="w-6 h-6 text-indigo-500" />
                <h2 className="text-xl font-light text-ink-black">AI Recipe Import</h2>
              </div>
              <p className="text-xs text-zinc-500 font-medium mb-8">Paste a recipe URL or upload a screenshot to automatically extract ingredients and instructions.</p>

              {aiError && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-xs font-medium border border-red-100 flex items-start gap-2">
                   <div className="mt-0.5"><X className="w-3.5 h-3.5" /></div>
                   {aiError}
                </div>
              )}

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Paste URL</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                       <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                       <input 
                         type="url"
                         placeholder="https://..."
                         value={aiUrl}
                         onChange={(e) => setAiUrl(e.target.value)}
                         disabled={isAiLoading}
                         className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors"
                       />
                    </div>
                    <button 
                      onClick={() => parseAiRecipe('url', { url: aiUrl })}
                      disabled={isAiLoading || !aiUrl.trim()}
                      className="px-6 py-3 bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50 hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 min-w-[100px]"
                    >
                      {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fetch'}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className=" absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-100"></div></div>
                  <div className="relative flex justify-center"><span className="bg-white px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300">OR</span></div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Upload Image / Screenshot</label>
                  <label className={`block w-full border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${isAiLoading ? 'opacity-50 pointer-events-none' : 'border-zinc-200 hover:border-indigo-400 hover:bg-indigo-50/30'}`}>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                           parseAiRecipe('image', { file });
                           // Reset input
                           e.target.value = '';
                        }
                      }}
                      disabled={isAiLoading}
                    />
                    <ImageIcon className="w-8 h-8 mx-auto text-zinc-300 mb-3" />
                    <span className="text-sm font-medium text-ink-black block mb-1">Click to browse or drag image</span>
                    <span className="text-xs text-zinc-400 block">JPEG, PNG up to 5MB</span>
                  </label>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
