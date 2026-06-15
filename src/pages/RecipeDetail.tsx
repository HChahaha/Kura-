import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Clock, Users, Flame, Dumbbell, CheckCircle2, Heart, X, Play, Sparkles, ShoppingBag, AlertTriangle } from 'lucide-react';
import { RECIPES } from '../constants';
import { View, InventoryItem, Recipe } from '../types';
import KuraLogo from '../components/KuraLogo';
import { getRecipeById, calculateMatchScore } from '../services/recipeService';
import { db, auth } from '../lib/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

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
 onEditRecipe?: (id: string) => void;
 tempRecipe?: any;
 onSaveTempRecipe?: (recipe: any) => void;
}

// Subtraction helper to deduct recipe quantities safely
function deductQuantity(invQty: string, recQty: string): { newQty: string; isDepleted: boolean } {
 const invNumMatch = invQty.match(/([0-9.]+)/);
 const recNumMatch = recQty.match(/([0-9.]+)/);

 if (invNumMatch && recNumMatch) {
 const invVal = parseFloat(invNumMatch[1]);
 const recVal = parseFloat(recNumMatch[1]);
 const newVal = invVal - recVal;
 
 if (newVal <= 0) {
 return { newQty: '0', isDepleted: true };
 }
 
 // Replace original number with deducted value, preserving units
 const unit = invQty.replace(invNumMatch[1], '').trim();
 return { newQty: `${newVal} ${unit}`, isDepleted: false };
 }
 
 // Fallback: full depletion
 return { newQty: '0', isDepleted: true };
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
 onToggleSaveRecipe,
 onEditRecipe,
 tempRecipe,
 onSaveTempRecipe
}: RecipeDetailProps) {
 const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
 const [individualAdded, setIndividualAdded] = useState<Record<string, boolean>>({});
 const [cookingMode, setCookingMode] = useState(false);
 const [currentStep, setCurrentStep] = useState(0);

 // Deduction overlay state
 const [isDeductionModalOpen, setIsDeductionModalOpen] = useState(false);
 const [selectedMatchIds, setSelectedMatchIds] = useState<Record<string, boolean>>({});
 const [isDeducting, setIsDeducting] = useState(false);
 const [deductionSuccess, setDeductionSuccess] = useState<string | null>(null);
 
 // Find recipe
 const recipe = useMemo(() => {
 if (id === 'temp-ai-suggestion') return tempRecipe;

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
 }, [id, inventory, customRecipes, tempRecipe]);

 const [editedName, setEditedName] = useState('');
 const [editedIngredients, setEditedIngredients] = useState<{ name: string; quantity: string }[]>([]);
 const [editedInstructions, setEditedInstructions] = useState<string[]>([]);
 const [isHeartOptimistic, setIsHeartOptimistic] = useState(false);

 // Sync edits when tempRecipe changes
 React.useEffect(() => {
 if (recipe && recipe.isTempSuggestion) {
 setEditedName(recipe.name || '');
 setEditedIngredients((recipe.fullIngredients || []).map((ing: any) => ({ name: ing.name || '', quantity: ing.quantity || '' })));
 setEditedInstructions(recipe.instructions || recipe.steps || []);
 }
 setIsHeartOptimistic(false);
 }, [recipe]);

 const activeRecipe = useMemo(() => {
 if (recipe && recipe.isTempSuggestion) {
 return {
 ...recipe,
 name: editedName,
 fullIngredients: editedIngredients,
 instructions: editedInstructions
 };
 }
 return recipe;
 }, [recipe, editedName, editedIngredients, editedInstructions]);

 const isSaved = useMemo(() => {
 if (!activeRecipe) return false;
 if (activeRecipe.isUserCreated && !activeRecipe.isTempSuggestion) return true;
 return savedRecipeIds.includes(activeRecipe.id);
 }, [activeRecipe, savedRecipeIds]);

 // Calculate ingredient statuses based on real inventory
 const processedIngredients = useMemo(() => {
 if (!activeRecipe) return [];
 return activeRecipe.fullIngredients?.map(ing => {
 const inventoryMatch = inventory.find(item => 
 item.name.toLowerCase().includes(ing.name.toLowerCase()) || 
 ing.name.toLowerCase().includes(item.name.toLowerCase())
 );
 
 let status: 'IN STOCK' | 'LOW STOCK' | 'OUT OF STOCK' = 'OUT OF STOCK';
 if (inventoryMatch) {
 status = inventoryMatch.daysLeft !== undefined && inventoryMatch.daysLeft <= 2 ? 'LOW STOCK' : 'IN STOCK';
 }
 
 return { ...ing, inStock: status, inventoryMatch };
 }) || [];
 }, [activeRecipe, inventory]);

 // Compute exact pantry matches for deduction modal
 const matchingInventoryItems = useMemo(() => {
 const matches: { inventoryItem: InventoryItem; recipeIng: any }[] = [];
 processedIngredients.forEach(p => {
 if (p.inventoryMatch) {
 matches.push({
 inventoryItem: p.inventoryMatch,
 recipeIng: p
 });
 }
 });
 return matches;
 }, [processedIngredients]);

 const baseServings = parseInt(activeRecipe?.servings || '1') || 1;
 const [servings, setServings] = useState(1);

 // Sync servings with recipe when recipe is loaded
 React.useEffect(() => {
 if (activeRecipe) {
 setServings(parseInt(activeRecipe.servings || '1') || 1);
 }
 }, [activeRecipe]);

 if (!activeRecipe) {
 return (
 <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-white">
 <p className="text-zinc-400 mb-8 font-light italic">Looking for recipe details in the scrapbook...</p>
 <button onClick={() => onViewChange('recipes')} className="text-ink-black underline font-bold uppercase tracking-widest text-[10px]">Back to Discovery</button>
 </div>
 );
 }

 const scaleFactor = servings / baseServings;

 const scaleQuantity = (qty: any) => {
 if (qty === undefined || qty === null || qty === '') return '0';
 const qtyStr = String(qty);
 return qtyStr.replace(/([0-9.]+)/g, (match) => {
 const num = parseFloat(match);
 if (isNaN(num)) return match;
 const scaled = num * scaleFactor;
 return scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1);
 });
 };

 const handleFinishCooking = () => {
 // Open inventory-deduction modal and pre-select all available matching items
 const initialSelections: Record<string, boolean> = {};
 matchingInventoryItems.forEach(match => {
 initialSelections[match.inventoryItem.id] = true;
 });
 setSelectedMatchIds(initialSelections);
 setDeductionSuccess(null);
 setIsDeductionModalOpen(true);
 };

 const executeInventoryDeduction = async () => {
 const userId = auth.currentUser?.uid;
 if (!userId) {
 setIsDeductionModalOpen(false);
 onViewChange('recipes');
 return;
 }

 try {
 setIsDeducting(true);
 const deductedNames: string[] = [];

 for (const match of matchingInventoryItems) {
 const itemId = match.inventoryItem.id;
 const isSelected = selectedMatchIds[itemId];

 if (isSelected) {
 const invItem = match.inventoryItem;
 // Scale ingredients used based on active servings selected by user
 const recipeUsedQty = scaleQuantity(match.recipeIng.quantity);

 const { newQty, isDepleted } = deductQuantity(invItem.quantity, recipeUsedQty);
 
 if (isDepleted) {
 // Delete directly from active Firestore inventory
 await deleteDoc(doc(db, `users/${userId}/inventory`, itemId));
 deductedNames.push(`${invItem.name} (consumed)`);
 } else {
 // Update remaining quantity in active Firestore inventory
 await updateDoc(doc(db, `users/${userId}/inventory`, itemId), {
 quantity: newQty
 });
 deductedNames.push(`${invItem.name} (-${recipeUsedQty})`);
 }
 }
 }

 setDeductionSuccess(
 deductedNames.length > 0 
 ? `Successfully deducted: ${deductedNames.join(', ')}` 
 : "Recipe completed! Enjoy your meal."
 );

 // Gracefully close modal of stock deduction and return to cockpit
 setTimeout(() => {
 setIsDeductionModalOpen(false);
 onViewChange('recipes');
 }, 3000);

 } catch (err) {
 console.error("Deduction script execution failed:", err);
 setDeductionSuccess("Unable to sync complete deduction to Firestore, closing.");
 setTimeout(() => {
 setIsDeductionModalOpen(false);
 onViewChange('recipes');
 }, 2500);
 } finally {
 setIsDeducting(false);
 }
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
 const totalSteps = activeRecipe.instructions?.length || 0;
 const progress = ((currentStep + 1) / totalSteps) * 100;
 const stepText = activeRecipe.instructions?.[currentStep] || '';
 const [title, ...descParts] = stepText.includes(':') ? stepText.split(':') : [`Step ${currentStep + 1}`, stepText];
 const description = descParts.join(':').trim();

 return (
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 className="fixed inset-0 z-[100] bg-white flex flex-col font-sans text-black"
 >
 <header className="px-6 py-6 border-b border-zinc-100 flex justify-between items-center bg-white/85 backdrop-blur-md">
 <button onClick={() => setCookingMode(false)} className="text-zinc-400 hover:text-ink-black transition-colors">
 <X className="w-6 h-6" />
 </button>
 <div className="text-center font-sans">
 <h2 className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400">Cooking {activeRecipe.name}</h2>
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
 <h3 className="text-4xl font-medium text-ink-black tracking-tighter max-w-md mx-auto leading-tight">{title}</h3>
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
 className="flex-1 py-5 border border-zinc-100 rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-400 disabled:opacity-20 hover:border-zinc-300 transition-all font-sans cursor-pointer"
 >
 Previous
 </button>
 {currentStep < totalSteps - 1 ? (
 <button 
 onClick={() => setCurrentStep(prev => prev + 1)}
 className="flex-[2] py-5 bg-ink-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:opacity-90 shadow-xl transition-all font-sans cursor-pointer"
 >
 Next Step
 </button>
 ) : (
 <button 
 onClick={() => {
 setCookingMode(false);
 handleFinishCooking();
 }}
 className="flex-[2] py-5 bg-bamboo-green text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:opacity-90 shadow-xl transition-all font-sans cursor-pointer animate-pulse"
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
 className="pb-64 min-h-screen bg-white relative font-sans text-black"
 >
 <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-6 bg-white/5 backdrop-blur-md transition-all">
 <button onClick={() => onViewChange('recipes')} className="text-ink-black hover:opacity-75 transition-opacity">
 <ArrowLeft className="w-5 h-5 black" />
 </button>
 <div className="flex items-center gap-1.5 select-none text-ink-black">
 <KuraLogo className="w-5 h-5" strokeWidth={3} />
 <span className="text-sm font-bold tracking-[0.3em] uppercase">KURA</span>
 </div>
 <div className="flex items-center gap-4">
 {activeRecipe.fullIngredients && (
 <div className="flex flex-col items-end justify-center">
 <span className="text-[8px] font-bold text-ink-black/40 uppercase tracking-widest">Inventory Match</span>
 <span className="text-xs font-bold text-bamboo-green">
 {Math.round((activeRecipe.matchScore || 0) / 100 * activeRecipe.fullIngredients.length)}/{activeRecipe.fullIngredients.length} Items Match
 </span>
 </div>
 )}
 
 {activeRecipe.isUserCreated && onEditRecipe && (
 <button 
 onClick={() => onEditRecipe(activeRecipe.id)}
 className="w-16 h-8 rounded-full flex items-center justify-center bg-white/40 hover:bg-white border border-zinc-100 shadow-sm text-zinc-400 hover:text-ink-black transition-all active:scale-95 text-[10px] uppercase font-bold tracking-widest cursor-pointer"
 >
 Edit
 </button>
 )}

 {onToggleSaveRecipe && (
 <button 
 onClick={(e) => {
 e.stopPropagation();
 if (activeRecipe.isTempSuggestion) {
 if (onSaveTempRecipe) {
 setIsHeartOptimistic(true);
 onSaveTempRecipe(activeRecipe);
 }
 } else {
 onToggleSaveRecipe(activeRecipe.id);
 }
 }}
 className="w-8 h-8 rounded-full flex items-center justify-center bg-white/40 hover:bg-white border border-zinc-100 shadow-sm text-zinc-400 hover:text-red-500 transition-all active:scale-95 cursor-pointer"
 title={(isSaved || isHeartOptimistic) ? "Remove from saved recipes" : "Save recipe"}
 >
 <Heart className={`w-4 h-4 transition-transform ${(isSaved || isHeartOptimistic) ? 'text-red-500 fill-red-500 scale-110' : 'text-zinc-400'}`} />
 </button>
 )}
 </div>
 </header>
 
 <div className="relative min-h-[40vh] w-full pt-28 pb-10 bg-zinc-950 text-white px-8 flex flex-col justify-end">
 <div className="relative">
 {activeRecipe.isTempSuggestion ? (
 <div className="mb-4 p-3 rounded-2xl bg-forest-green/10 border border-forest-green/25 text-forest-green text-center" id="temp-ai-save-banner">
 <span className="text-[9px] font-black uppercase tracking-widest block animate-pulse text-forest-green">✦ Gemini Smart Suggested ✦</span>
 </div>
 ) : activeRecipe.isAiSuggested ? (
 <span className="inline-flex items-center gap-1 bg-forest-green text-white text-[9px] uppercase font-extrabold tracking-widest px-3 py-1 rounded-full mb-4 shadow border border-green-700">
 <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse animate-duration-1000" /> AI Spark Suggestion
 </span>
 ) : null}
 
 {activeRecipe.isTempSuggestion ? (
 <div className="space-y-2 mt-2 mb-8" id="recipe-title-container">
 <label className="text-[9px] font-black uppercase tracking-widest text-forest-green block">RECIPE TITLE</label>
 <input
 type="text"
 value={editedName}
 onChange={(e) => setEditedName(e.target.value)}
 className="w-full text-3xl font-extrabold pb-2 bg-transparent text-white border-b border-zinc-850 focus:outline-none focus:border-forest-green transition-colors"
 placeholder="RECIPE TITLE"
 />
 </div>
 ) : (
 <h2 className="text-4xl font-extrabold leading-tight mb-8">
 {activeRecipe.name}
 </h2>
 )}

 <div className="flex flex-wrap gap-y-4 gap-x-8 text-[11px] font-extrabold uppercase tracking-widest text-zinc-300">
 <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-zinc-500" /> {activeRecipe.time || '15 mins'}</div>
 <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
 <Users className="w-4 h-4 text-zinc-500" /> 
 <button 
 onClick={(e) => { e.stopPropagation(); setServings(Math.max(1, servings - 1)); }}
 className="hover:scale-125 transition-transform px-1 font-bold text-sm text-indigo-400 cursor-pointer"
 >-</button>
 <span className="mx-1 text-xs font-bold w-12 text-center">{servings} pers</span>
 <button 
 onClick={(e) => { e.stopPropagation(); setServings(servings + 1); }}
 className="hover:scale-125 transition-transform px-1 font-bold text-sm text-indigo-400 cursor-pointer"
 >+</button>
 </div>
 </div>
 </div>
 </div>

 <div className="px-6 py-12 -mt-4 bg-white rounded-t-[32px] relative z-10 shadow-2xl">
 <section className="mb-20">
 {activeRecipe.isTempSuggestion ? (
 <div id="ingredients-list-wrapper" className="space-y-6">
 <div className="flex justify-between items-center mb-8 border-b border-zinc-100 pb-3">
 <div>
 <label className="text-[9px] font-black uppercase tracking-widest text-[#38bdf8] block mb-1">INGREDIENTS LIST</label>
 <h2 className="text-3xl font-light text-ink-black select-none">Ingredients List</h2>
 </div>
 <button
 onClick={() => setEditedIngredients(prev => [...prev, { name: '', quantity: '' }])}
 className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-ink-black text-[10px] font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center gap-1 shrink-0"
 >
 + Add Ingredient
 </button>
 </div>

 <div className="space-y-4">
 {editedIngredients.map((item, idx) => (
 <div key={idx} className="flex gap-4 items-center bg-zinc-50 border border-zinc-100 p-4 rounded-2xl">
 <span className="text-[10px] font-extrabold text-zinc-300 w-6 shrink-0">#{idx + 1}</span>
 <input
 type="text"
 value={item.name}
 onChange={(e) => {
 const val = e.target.value;
 setEditedIngredients(prev => prev.map((ing, i) => i === idx ? { ...ing, name: val } : ing));
 }}
 className="flex-1 text-sm font-semibold text-ink-black focus:outline-none bg-transparent border-b border-transparent focus:border-zinc-300 pb-1.5 transition-colors"
 placeholder="Ingredient name"
 />
 <input
 type="text"
 value={item.quantity}
 onChange={(e) => {
 const val = e.target.value;
 setEditedIngredients(prev => prev.map((ing, i) => i === idx ? { ...ing, quantity: val } : ing));
 }}
 className="w-28 text-xs text-zinc-500 focus:outline-none bg-transparent border-b border-transparent focus:border-zinc-300 pb-1.5 transition-colors"
 placeholder="Amount (e.g. 2 cups)"
 />
 <button
 onClick={() => {
 setEditedIngredients(prev => prev.filter((_, i) => i !== idx));
 }}
 className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 ))}
 </div>
 </div>
 ) : (
 <>
 <h2 className="text-3xl font-light mb-12 text-ink-black select-none">Ingredients</h2>
 <div className="bg-zinc-50 border border-zinc-100/50 rounded-[24px] p-4">
 {processedIngredients?.map((item, idx) => (
 <div 
 key={idx} 
 onClick={() => toggleIngredient(idx)}
 className={`flex items-center justify-between p-6 border-b border-zinc-100 last:border-0 cursor-pointer transition-all ${checkedIngredients[idx] ? 'opacity-40 font-light' : 'opacity-100 font-semibold'}`}
 >
 <div className="flex items-center gap-5 min-w-0 flex-1 text-black">
 <div className={`w-6 h-6 rounded-md border shrink-0 flex items-center justify-center transition-all ${
 checkedIngredients[idx] ? 'bg-ink-black border-ink-black' : 'border-zinc-350 bg-white'
 }`}>
 {checkedIngredients[idx] && <CheckCircle2 className="w-4 h-4 text-white animate-in zoom-in-50" />}
 </div>
 <div className="flex items-center gap-2 flex-wrap min-w-0">
 {item.quantity && (
 <span className="px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-black whitespace-nowrap shrink-0">
 {scaleQuantity(item.quantity)}
 </span>
 )}
 <span className={`text-base font-bold font-sans break-words ${checkedIngredients[idx] ? 'text-zinc-400 line-through' : 'text-zinc-800'}`}>
 <span className={lastAddedIngredient && item.name.toLowerCase().includes(lastAddedIngredient.toLowerCase()) ? 'text-bamboo-green underline underline-offset-4 decoration-2' : ''}>
 {item.name}
 </span>
 </span>
 </div>
 </div>
 <span 
 onClick={(e) => {
 if (item.inStock === 'OUT OF STOCK') {
 e.stopPropagation(); // Stop toggling row checked state
 if (individualAdded[item.name]) return;
 onAddToShoppingList([item.name]);
 setIndividualAdded(prev => ({ ...prev, [item.name]: true }));
 }
 }}
 className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
 checkedIngredients[idx] ? 'text-zinc-400 bg-zinc-100' :
 item.inStock === 'IN STOCK' ? 'text-bamboo-green bg-[#E8F5E9]/50' : 
 item.inStock === 'LOW STOCK' ? 'text-orange-400 bg-[#FFF3E0]/50' : 
 individualAdded[item.name] ? 'text-green-600 bg-green-50 border border-green-200 animate-in zoom-in-75' :
 'text-red-500 bg-red-50 border border-red-200 hover:scale-105 active:scale-95 cursor-pointer shadow-sm'
 }`}
 title={item.inStock === 'OUT OF STOCK' && !individualAdded[item.name] ? "Click to add missing ingredient to To-Buy List" : undefined}
 >
 {checkedIngredients[idx] 
 ? 'CHECKED' 
 : item.inStock === 'OUT OF STOCK' 
 ? (individualAdded[item.name] ? 'ADDED ✓' : '+ Add to To-Buy List') 
 : item.inStock
 }
 </span>
 </div>
 ))}
 </div>
 </>
 )}

 <div className="flex flex-col gap-3 mt-10">
 <button 
 onClick={addMissingToShopping}
 className="w-full py-5 border border-zinc-200 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-ink-black hover:border-zinc-400 transition-all font-sans cursor-pointer"
 >
 ADD MISSING TO LIST
 </button>
 </div>
 </section>

 <section className="mb-24 px-2">
 {activeRecipe.isTempSuggestion ? (
 <div id="cooking-steps-section" className="space-y-8">
 <div className="flex justify-between items-center mb-10 border-b border-zinc-100 pb-3">
 <div>
 <label className="text-[9px] font-black uppercase tracking-widest text-[#38bdf8] block mb-1">COOKING STEPS</label>
 <h2 className="text-3xl font-light text-ink-black select-none">Cooking Steps</h2>
 </div>
 <button
 onClick={() => setEditedInstructions(prev => [...prev, ''])}
 className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-ink-black text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center gap-1 shrink-0"
 >
 + Add Step
 </button>
 </div>

 <div className="space-y-6">
 {editedInstructions.map((step, idx) => (
 <div key={idx} className="flex gap-4 items-start bg-zinc-50 border border-zinc-105 p-4 rounded-2xl animate-in fade-inslide-in-from-bottom-2">
 <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pt-1.5 w-16 shrink-0">Step {idx + 1}</span>
 <textarea
 value={step}
 onChange={(e) => {
 const val = e.target.value;
 setEditedInstructions(prev => prev.map((s, i) => i === idx ? val : s));
 }}
 className="flex-1 text-sm font-normal font-sans text-zinc-700 bg-transparent focus:outline-none focus:border-b focus:border-ink-black pb-1 resize-none min-h-[65px]"
 placeholder="Describe instruction step..."
 />
 <button
 onClick={() => {
 setEditedInstructions(prev => prev.filter((_, i) => i !== idx));
 }}
 className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 ))}
 </div>
 </div>
 ) : (
 <>
 <div className="flex items-center gap-6 mb-16">
 <h2 className="text-3xl font-light text-ink-black select-none">Preparation</h2>
 <div className="h-[1px] flex-1 bg-zinc-100" />
 <button 
 onClick={() => {
 setCookingMode(true);
 setCurrentStep(0);
 }}
 className="px-5 py-2.5 bg-ink-black/5 text-zinc-400 rounded-full text-[8px] font-bold uppercase tracking-widest hover:bg-ink-black hover:text-white transition-all font-sans cursor-pointer"
 >
 Step-By-Step Guide
 </button>
 </div>
 <div className="space-y-16">
 {activeRecipe.instructions?.map((step, idx) => {
 const [title, ...descParts] = step.includes(':') ? step.split(':') : [`Step ${idx + 1}`, step];
 const description = descParts.join(':').trim();
 return (
 <div key={idx} className="flex gap-10 group">
 <div className="flex flex-col items-center gap-6">
 <div className="w-12 h-12 rounded-full border border-zinc-100 flex items-center justify-center shrink-0 text-xs font-extrabold text-zinc-300 bg-white transition-all group-hover:scale-110 group-hover:border-zinc-300 shadow-sm font-sans">
 {String(idx + 1).padStart(2, '0')}
 </div>
 </div>
 <div className="flex-1 space-y-2">
 <h3 className="text-xl font-bold text-ink-black tracking-tight leading-tight">{title}</h3>
 <p className="text-base leading-relaxed text-zinc-500 font-light font-sans">
 {description}
 </p>
 </div>
 </div>
 );
 })}
 </div>
 </>
 )}
 </section>

 <div className="fixed bottom-28 left-6 right-6 z-40">
 <button 
 onClick={handleFinishCooking}
 className="w-full bg-[#1A1A1A] hover:bg-zinc-800 text-white py-6 rounded-2xl flex items-center justify-center gap-4 font-bold uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
 >
 <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
 <CheckCircle2 className="w-3.5 h-3.5 text-black" />
 </div>
 FINISH COOK 🍳
 </button>
 </div>
 </div>

 {/* Foolproof Inventory-Deduction Loop Overlay Modal */}
 <AnimatePresence>
 {isDeductionModalOpen && (
 <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center px-4 pb-24">
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => {
 if (!isDeducting && !deductionSuccess) setIsDeductionModalOpen(false);
 }}
 className="absolute inset-0 bg-black/60 backdrop-blur-sm"
 />
 
 <motion.div 
 initial={{ y: '100%', opacity: 0 }}
 animate={{ y: 0, opacity: 1 }}
 exit={{ y: '100%', opacity: 0 }}
 className="relative w-full max-w-lg bg-white rounded-[32px] overflow-hidden shadow-2xl p-8"
 >
 {/* Reset/Dismiss Box */}
 {!isDeducting && !deductionSuccess && (
 <button 
 onClick={() => setIsDeductionModalOpen(false)}
 className="absolute top-6 right-6 p-2 hover:bg-zinc-50 rounded-full"
 >
 <X className="w-5 h-5 text-zinc-400" />
 </button>
 )}

 <div className="flex items-center gap-3 mb-6">
 <CheckCircle2 className="w-6 h-6 text-bamboo-green" />
 <h3 className="text-xl font-light text-ink-black">Complete Your Meal</h3>
 </div>

 {deductionSuccess ? (
 <motion.div 
 initial={{ scale: 0.95, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 className="p-6 bg-bamboo-green/5 border border-bamboo-green/20 rounded-2xl text-center space-y-3 my-4"
 >
 <div className="w-10 h-10 rounded-full bg-bamboo-green/10 flex items-center justify-center mx-auto text-bamboo-green">
 <CheckCircle2 className="w-6 h-6" />
 </div>
 <h4 className="text-sm font-bold text-bamboo-green uppercase tracking-widest">Deduction Completed</h4>
 <p className="text-xs text-zinc-600 font-semibold leading-relaxed max-w-xs mx-auto">
 {deductionSuccess}
 </p>
 </motion.div>
 ) : (
 <div className="space-y-6">
 <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex gap-3 text-xs text-zinc-500 leading-snug">
 <ShoppingBag className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
 <p>
 <strong>Smart Auto-Deduction:</strong> The ingredients below exist in your cupboard. Kura will deduct the recipe quantities to keep your actual fridge stock accurate.
 </p>
 </div>

 {matchingInventoryItems.length === 0 ? (
 <p className="text-center py-8 text-zinc-400 text-xs italic">
 No matching pantry items detected. Cupboard will remain untouched.
 </p>
 ) : (
 <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
 <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">
 Review match list before consumption:
 </span>
 {matchingInventoryItems.map((match) => {
 const isChecked = selectedMatchIds[match.inventoryItem.id] || false;
 const usedQty = scaleQuantity(match.recipeIng.quantity);
 
 return (
 <div 
 key={match.inventoryItem.id}
 onClick={() => {
 if (isDeducting) return;
 setSelectedMatchIds(prev => ({
 ...prev,
 [match.inventoryItem.id]: !prev[match.inventoryItem.id]
 }));
 }}
 className={`flex justify-between items-center p-3.5 border rounded-xl cursor-pointer transition-all ${
 isChecked 
 ? 'bg-zinc-50 border-ink-black' 
 : 'bg-white border-zinc-100 text-zinc-400'
 }`}
 >
 <div className="flex items-center gap-3">
 <div className={`w-5 h-5 rounded border flex items-center justify-center ${
 isChecked ? 'bg-ink-black border-ink-black text-white' : 'border-zinc-300'
 }`}>
 {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
 </div>
 <span className="text-xs font-bold leading-none">{match.inventoryItem.name}</span>
 </div>
 <div className="flex items-center gap-1.5 text-[10px] font-bold">
 <span className="text-zinc-400 line-through">{match.inventoryItem.quantity}</span>
 <span className="text-ink-black font-extrabold bg-zinc-100 px-1.5 py-0.5 rounded">
 - {usedQty}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 )}

 <button
 disabled={isDeducting}
 onClick={executeInventoryDeduction}
 className="w-full bg-[#1A1A1A] hover:bg-zinc-800 disabled:opacity-40 text-white font-bold py-4 rounded-2xl uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 mt-4 cursor-pointer"
 >
 {isDeducting ? (
 <>
 <RefreshCw className="w-4 h-4 animate-spin" />
 Deducting quantities...
 </>
 ) : (
 "Confirm Deduction & Exit"
 )}
 </button>
 </div>
 )}
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </motion.div>
 );
}

// Inline Spinner substitute for RefreshCw
function RefreshCw(props: any) {
 return (
 <svg className={props.className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
 <path d="M3 3v5h5"/>
 <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
 <path d="M16 16h5v5"/>
 </svg>
 );
}
