export const foodCategoryMapping: Record<string, string[]> = {
 'Vegetables': ['carrot', 'tomato', 'potato', 'onion', 'garlic', 'broccoli', 'spinach', 'lettuce', 'cabbage', 'pepper', 'cucumber', 'mushroom', 'celery', 'corn', 'zucchini'],
 'Fruits': ['apple', 'banana', 'orange', 'grape', 'strawberry', 'lemon', 'lime', 'avocado', 'blueberry', 'peach', 'watermelon', 'cherry', 'kiwi', 'mango', 'pear'],
 'Meat & Seafood': ['chicken', 'beef', 'pork', 'fish', 'salmon', 'shrimp', 'lamb', 'turkey', 'bacon', 'tuna', 'crab', 'sausage', 'steak'],
 'Dairy & Eggs': ['milk', 'cheese', 'egg', 'butter', 'yogurt', 'cream', 'mozzarella', 'cheddar'],
 'Pantry': ['oil', 'salt', 'sugar', 'spice', 'sauce', 'vinegar', 'honey', 'jam', 'peanut butter', 'beans', 'canned', 'soup', 'flour', 'broth', 'ketchup', 'mustard', 'mayo', 'soy sauce', 'coffee', 'tea'],
 'Grains': ['rice', 'pasta', 'noodle', 'bread', 'oats', 'cereal', 'quinoa', 'bagel', 'macaroni', 'spaghetti'],
 'Bakery': ['cake', 'cookie', 'pastry', 'croissant', 'muffin', 'pie', 'brownie', 'donut'],
 'Frozen': ['ice cream', 'frozen pizza', 'frozen peas', 'popsicle', 'pizza'],
 'Household': ['soap', 'detergent', 'paper', 'tissue', 'cleaner', 'sponge', 'trash bag', 'napkin', 'bleach']
};

export function guessCategory(itemName: string): string {
 if (!itemName) return '';
 const lowerName = itemName.toLowerCase();
 for (const [category, keywords] of Object.entries(foodCategoryMapping)) {
 if (keywords.some(keyword => lowerName.includes(keyword))) {
 return category;
 }
 }
 return '';
}
