import { Recipe, InventoryItem } from '../types';

const MOCK_WEB_RECIPES: Recipe[] = [
 {
 id: 'web_1',
 name: 'Spicy Salmon Bowls',
 calories: 450,
 protein: '32g',
 fat: '20g',
 carbs: '40g',
 time: '15 mins',
 servings: '2',
 tags: ['High Protein', 'Under 15 Mins', 'Japanese'],
 image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=800',
 videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
 isExternal: true,
 difficulty: 'Medium',
 fullIngredients: [
 { name: 'Salmon Fillet', quantity: '300g' },
 { name: 'Sushi Rice', quantity: '1 cup' },
 { name: 'Avocado', quantity: '1' },
 { name: 'Soy Sauce', quantity: '2 tbsp' }
 ],
 instructions: [
 'Cook the sushi rice according to package directions.',
 'Slice the salmon into cubes and toss with soy sauce.',
 'Assemble the bowl with rice, salmon, and avocado.'
 ]
 },
 {
 id: 'web_2',
 name: 'Vegan Tofu Stir-fry',
 calories: 320,
 protein: '18g',
 fat: '12g',
 carbs: '35g',
 time: '20 mins',
 servings: '2',
 tags: ['Vegan', 'Quick', 'Japanese'],
 image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800',
 videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
 isExternal: true,
 difficulty: 'Easy',
 fullIngredients: [
 { name: 'Firm Tofu', quantity: '200g' },
 { name: 'Broccoli', quantity: '1 head' },
 { name: 'Sesame Oil', quantity: '1 tbsp' },
 { name: 'Ginger', quantity: '10g' }
 ],
 instructions: [
 'Press tofu to remove water, then cube.',
 'Stir-fry ginger and tofu in sesame oil.',
 'Add broccoli and cook until tender.'
 ]
 },
 {
 id: 'web_3',
 name: 'Cantonese Steamed Fish',
 calories: 380,
 protein: '45g',
 fat: '10g',
 carbs: '8g',
 time: '20 mins',
 servings: '4',
 tags: ['Cantonese', 'High Protein', 'Seafood'],
 image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800',
 videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
 isExternal: true,
 difficulty: 'Medium',
 fullIngredients: [
 { name: 'Whole Fish', quantity: '1' },
 { name: 'Ginger', quantity: '20g' },
 { name: 'Scallions', quantity: '3' },
 { name: 'Liquid Soy Sauce', quantity: '3 tbsp' }
 ],
 instructions: [
 'Clean and score the fish skin.',
 'Steam with ginger for 10 minutes.',
 'Discard water, top with scallions and soy sauce.'
 ]
 },
 {
 id: 'web_4',
 name: 'Miso Chicken Salad',
 calories: 410,
 protein: '38g',
 fat: '15g',
 carbs: '12g',
 time: '15 mins',
 servings: '2',
 tags: ['High Protein', 'Under 15 Mins', 'Japanese'],
 image: 'https://images.unsplash.com/photo-1546793665-c74683c3f38d?auto=format&fit=crop&q=80&w=800',
 videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
 isExternal: true,
 difficulty: 'Easy',
 fullIngredients: [
 { name: 'Chicken Breast', quantity: '250g' },
 { name: 'Mixed Greens', quantity: '100g' },
 { name: 'Miso Paste', quantity: '1 tbsp' },
 { name: 'Sesame Seeds', quantity: '1 tsp' }
 ],
 instructions: [
 'Grill chicken until cooked, then slice.',
 'Toss greens with miso dressing.',
 'Top with chicken and sesame seeds.'
 ]
 },
 {
 id: 'web_5',
 name: 'Crispy Garlic Tofu',
 calories: 350,
 protein: '20g',
 fat: '18g',
 carbs: '22g',
 time: '12 mins',
 servings: '2',
 tags: ['Vegan', 'Under 15 Mins'],
 image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800',
 isExternal: true,
 difficulty: 'Easy',
 fullIngredients: [
 { name: 'Tofu', quantity: '300g' },
 { name: 'Garlic', quantity: '4 cloves' },
 { name: 'Cornstarch', quantity: '2 tbsp' }
 ],
 instructions: [
 'Coat tofu in cornstarch.',
 'Fry until crispy.',
 'Toss with minced garlic.'
 ]
 },
 {
 id: 'web_6',
 name: 'Yuzu Pepper Chicken',
 calories: 390,
 protein: '42g',
 fat: '14g',
 carbs: '5g',
 time: '18 mins',
 servings: '2',
 tags: ['High Protein', 'Japanese'],
 image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=800',
 videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
 isExternal: true,
 difficulty: 'Medium',
 fullIngredients: [
 { name: 'Chicken Thighs', quantity: '400g' },
 { name: 'Yuzu Kosho', quantity: '1 tsp' },
 { name: 'Sake', quantity: '1 tbsp' }
 ],
 instructions: [
 'Marinate chicken in sake and yuzu kosho.',
 'Sear skin-side down until crispy.',
 'Cook through and rest before slicing.'
 ]
 },
 {
 id: 'web_7',
 name: 'Soba Noodle Salad',
 calories: 280,
 protein: '12g',
 fat: '6g',
 carbs: '48g',
 time: '10 mins',
 servings: '1',
 tags: ['Under 15 Mins', 'Vegan', 'Japanese'],
 image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=800',
 isExternal: true,
 difficulty: 'Easy',
 fullIngredients: [
 { name: 'Soba Noodles', quantity: '100g' },
 { name: 'Cucumber', quantity: '1/2' },
 { name: 'Shiso Leaves', quantity: '3' }
 ],
 instructions: [
 'Boil soba for 4 minutes, then rinse cold.',
 'Slice cucumber and shiso leaves.',
 'Toss together with cold dipping sauce.'
 ]
 },
 {
 id: 'web_8',
 name: 'Cantonese Shrimp Dumplings',
 calories: 220,
 protein: '15g',
 fat: '8g',
 carbs: '25g',
 time: '30 mins',
 servings: '2',
 tags: ['Cantonese', 'Seafood'],
 image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&q=80&w=800',
 videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
 isExternal: true,
 difficulty: 'Hard',
 fullIngredients: [
 { name: 'Shrimp', quantity: '200g' },
 { name: 'Bamboo Shoots', quantity: '50g' },
 { name: 'Rice Flour', quantity: '100g' }
 ],
 instructions: [
 'Prepare shrimp filling.',
 'Make rice flour dough using hot water.',
 'Wrap and steam for 6 minutes.'
 ]
 },
 {
 id: 'web_9',
 name: 'Oolong Tea Smoked Duck',
 calories: 550,
 protein: '35g',
 fat: '42g',
 carbs: '2g',
 time: '45 mins',
 servings: '4',
 tags: ['Cantonese', 'High Protein'],
 image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&q=80&w=800',
 videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
 isExternal: true,
 difficulty: 'Hard',
 fullIngredients: [
 { name: 'Duck Breast', quantity: '2' },
 { name: 'Oolong Tea Leaves', quantity: '2 tbsp' },
 { name: 'Five Spice Powder', quantity: '1 tsp' }
 ],
 instructions: [
 'Rub duck with spices.',
 'Smoke with tea leaves for 20 mins.',
 'Sear skin until crispy.'
 ]
 },
 {
 id: 'web_10',
 name: 'Steamed Egg with Scallops',
 calories: 180,
 protein: '14g',
 fat: '10g',
 carbs: '4g',
 time: '15 mins',
 servings: '2',
 tags: ['Cantonese', 'Under 15 Mins', 'Seafood'],
 image: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&q=80&w=800',
 isExternal: true,
 difficulty: 'Medium',
 fullIngredients: [
 { name: 'Eggs', quantity: '2' },
 { name: 'Scallops', quantity: '4' },
 { name: 'Chicken Broth', quantity: '150ml' }
 ],
 instructions: [
 'Whisk eggs and broth.',
 'Add scallops.',
 'Steam for 10 minutes.'
 ]
 },
 {
 id: 'web_11',
 name: 'Mapo Eggplant',
 calories: 290,
 protein: '8g',
 fat: '15g',
 carbs: '28g',
 time: '20 mins',
 servings: '2',
 tags: ['Vegan', 'Japanese'],
 image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800',
 videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
 isExternal: true,
 difficulty: 'Medium',
 fullIngredients: [
 { name: 'Eggplant', quantity: '2' },
 { name: 'Doubanjiang', quantity: '1 tbsp' },
 { name: 'Minced Garlic', quantity: '1 tbsp' }
 ],
 instructions: [
 'Dice and sauté eggplant.',
 'Add spices and doubanjiang.',
 'Simmer until soft.'
 ]
 },
 {
 id: 'web_12',
 name: 'Western Garlic Ribeye',
 calories: 650,
 protein: '52g',
 fat: '45g',
 carbs: '2g',
 time: '15 mins',
 servings: '1',
 tags: ['Western', 'High Protein', 'Under 15 Mins'],
 image: 'https://images.unsplash.com/photo-1546241072-48010ad28c2c?auto=format&fit=crop&q=80&w=800',
 videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
 isExternal: true,
 difficulty: 'Medium',
 fullIngredients: [
 { name: 'Ribeye Steak', quantity: '300g' },
 { name: 'Garlic', quantity: '3 cloves' },
 { name: 'Butter', quantity: '20g' }
 ],
 instructions: [
 'Season and sear steak.',
 'Baste with garlic and butter.',
 'Rest before serving.'
 ]
 },
 {
 id: 'web_13',
 name: 'Asian Beef Stir-fry',
 calories: 420,
 protein: '35g',
 fat: '18g',
 carbs: '22g',
 time: '12 mins',
 servings: '2',
 tags: ['Asian', 'Beef', 'Under 15 Mins'],
 image: 'https://images.unsplash.com/photo-1512058560566-d8d4c7a48d0a?auto=format&fit=crop&q=80&w=800',
 isExternal: true,
 difficulty: 'Easy',
 fullIngredients: [
 { name: 'Beef Strips', quantity: '300g' },
 { name: 'Bell Pepper', quantity: '1' },
 { name: 'Soy Sauce', quantity: '2 tbsp' }
 ],
 instructions: [
 'High heat stir-fry beef until browned.',
 'Add peppers and sauce.',
 'Serve over rice.'
 ]
 },
 {
 id: 'web_14',
 name: 'Japanese Beef Tataki',
 calories: 280,
 protein: '30g',
 fat: '12g',
 carbs: '8g',
 time: '20 mins',
 servings: '2',
 tags: ['Japanese', 'Beef', 'Seared'],
 image: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&q=80&w=800',
 isExternal: true,
 difficulty: 'Medium',
 fullIngredients: [
 { name: 'Beef Fillet', quantity: '250g' },
 { name: 'Ponzu Sauce', quantity: '3 tbsp' },
 { name: 'Daikon Radish', quantity: '50g' }
 ],
 instructions: [
 'Lightly sear the outside of the beef.',
 'Chill and slice thinly.',
 'Serve with ponzu and grated daikon.'
 ]
 },
 {
 id: 'web_15',
 name: 'Classic Beef Stew',
 calories: 520,
 protein: '40g',
 fat: '25g',
 carbs: '30g',
 time: '90 mins',
 servings: '4',
 tags: ['Western', 'Beef', 'Comfort'],
 image: 'https://images.unsplash.com/photo-1534939561126-7557d4ba97f8?auto=format&fit=crop&q=80&w=800',
 isExternal: true,
 difficulty: 'Medium',
 fullIngredients: [
 { name: 'Beef Chuck', quantity: '600g' },
 { name: 'Potatoes', quantity: '3' },
 { name: 'Carrots', quantity: '2' },
 { name: 'Red Wine', quantity: '200ml' }
 ],
 instructions: [
 'Brown beef cubes in a pot.',
 'Add vegetables and wine.',
 'Simmer until tender.'
 ]
 }
];

export function calculateMatchScore(recipe: Recipe, inventory: InventoryItem[]): number {
 if (!recipe.fullIngredients) return 0;
 
 const totalItems = recipe.fullIngredients.length;
 let matches = 0;
 
 recipe.fullIngredients.forEach(ing => {
 const hasItem = inventory.some(item => 
 item.name.toLowerCase().includes(ing.name.toLowerCase()) || 
 ing.name.toLowerCase().includes(item.name.toLowerCase())
 );
 if (hasItem) matches++;
 });
 
 return Math.round((matches / totalItems) * 100);
}

export async function searchWebRecipes(query: string, inventory: InventoryItem[]): Promise<Recipe[]> {
 // Simulate delay
 await new Promise(resolve => setTimeout(resolve, 1500));
 
 let results = [...MOCK_WEB_RECIPES];
 
 if (query) {
 results = results.filter(r => 
 r.name.toLowerCase().includes(query.toLowerCase()) || 
 r.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
 );
 }
 
 return results.map(r => ({
 ...r,
 matchScore: calculateMatchScore(r, inventory)
 }));
}

export function getRecipeById(id: string): Recipe | undefined {
 return MOCK_WEB_RECIPES.find(r => r.id === id);
}
