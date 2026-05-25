import { InventoryItem, Recipe } from './types';

export const INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: '1',
    name: 'Whole Milk',
    quantity: '1.0L',
    category: 'Dairy & Eggs',
    location: 'Fridge',
    expiryDate: '2026-04-27',
    daysLeft: 1,
    isExpiringSoon: true,
    image: 'https://images.unsplash.com/photo-1550583724-125581f77833?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: '2',
    name: 'Baby Spinach',
    quantity: '200g',
    category: 'Vegetables',
    location: 'Crisper',
    expiryDate: '2026-04-28',
    daysLeft: 2,
    isExpiringSoon: true,
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: '3',
    name: 'Carrots',
    quantity: '500g',
    category: 'Vegetables',
    location: 'Pantry',
    daysLeft: 7,
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: '4',
    name: 'Onions',
    quantity: '3 qty',
    category: 'Vegetables',
    location: 'Pantry',
    daysLeft: 12,
    image: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: '5',
    name: 'Atlantic Salmon',
    quantity: '350g',
    category: 'Meat & Seafood',
    location: 'Freezer',
    daysLeft: 0,
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=200'
  }
];

export const RECIPES: Recipe[] = [
  {
    id: '1',
    name: 'Washi Mapo Tofu',
    jpName: '和風麻婆豆腐',
    calories: 520,
    protein: '28g',
    fat: '15g',
    carbs: '45g',
    time: '20 mins',
    servings: '2',
    difficulty: 'Easy',
    tags: ['Bamboo Green', 'Ready to Cook'],
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800',
    readyToCook: true,
    fullIngredients: [
      { name: 'Soft Tofu', quantity: '300g', inStock: 'IN STOCK' },
      { name: 'Ground Pork', quantity: '150g', inStock: 'LOW STOCK' },
      { name: 'Miso Paste', quantity: '2 tbsp', inStock: 'IN STOCK' },
      { name: 'Ginger', quantity: '10g', inStock: 'IN STOCK' }
    ],
    instructions: [
      'Mindful Prep: Carefully dice the Tofu into 2cm cubes and finely grate the ginger. Let the ground pork sit at room temperature for 10 minutes.',
      'Searing the Foundation: In a heavy wok or pan, heat 1 tbsp of oil. Sauté ginger until fragrant, then add ground pork. Break it apart and cook until beautifully browned and crispy.',
      'Flavor Harmony: Add the miso paste and your Japanese seasonings. Stir constantly for 2 minutes to allow the miso to caramelize slightly without burning.',
      'Gentle Folding: Add 50ml of dashi or water to create a sauce. Gently slide the tofu cubes into the pan. Use an folding motion rather than stirring to keep the tofu intact. Simmer quietly for 5 minutes.',
      'Final Touch: Garnish with finely sliced green onions and a drizzle of chili oil if desired.'
    ]
  },
  {
    id: '2',
    name: 'Spring Avocado & Seed Salad',
    calories: 340,
    protein: '12g',
    fat: '22g',
    carbs: '18g',
    time: '15 mins',
    servings: '1',
    difficulty: 'Easy',
    tags: ['Healthy'],
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800',
    readyToCook: false,
    missingItems: 2,
    missingIngredients: ['Ripe Avocado', 'Pumpkin Seeds'],
    fullIngredients: [
      { name: 'Baby Spinach', quantity: '100g', inStock: 'IN STOCK' },
      { name: 'Cucumber', quantity: '1/2', inStock: 'IN STOCK' },
      { name: 'Avocado', quantity: '1', inStock: 'OUT OF STOCK' },
      { name: 'Pumpkin Seeds', quantity: '20g', inStock: 'OUT OF STOCK' }
    ],
    instructions: [
      'Gently wash the baby spinach in cold water. Use a salad spinner or paper towels to dry them completely—moisture is the enemy of a crisp salad.',
      'Halve the avocado and remove the pit. Slice into delicate fans or thin wedges. Slice the cucumber into translucent rounds to add a refreshing crunch.',
      'Toast your pumpkin seeds in a dry pan over medium heat for 2-3 minutes until they start to pop and smell nuttier.',
      'Whisk together a simple lemon-miso dressing. Arrange the spinach, avocado, and cucumber, then sprinkle with the warm toasted seeds just before serving.'
    ]
  },
  {
    id: '3',
    name: 'Miso Glazed Salmon & Bok Choy',
    jpName: '味噌鮭と青梗菜',
    calories: 420,
    protein: '35g',
    fat: '18g',
    carbs: '12g',
    time: '25 mins',
    servings: '2',
    difficulty: 'Medium',
    tags: ['High Protein', 'Seafood'],
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=800',
    readyToCook: true,
    fullIngredients: [
      { name: 'Fresh Salmon Fillets', quantity: '350g', inStock: 'IN STOCK' },
      { name: 'White Miso Paste', quantity: '20g', inStock: 'LOW STOCK' },
      { name: 'Baby Bok Choy', quantity: '150g', inStock: 'IN STOCK' },
      { name: 'Mirin & Soy Sauce', quantity: '1 tbsp', inStock: 'IN STOCK' },
      { name: 'Sesame Seeds', quantity: '1 tsp', inStock: 'IN STOCK' }
    ],
    instructions: [
      'The Glaze: Whisk together white miso paste, mirin, soy sauce, and a dash of honey in a small bowl until smooth and velvety. Set aside to let the flavors meld.',
      'Skin-Side Down: Pat the salmon fillets completely dry with a paper towel. Heat a drop of oil in a cast-iron pan over medium-high heat. Place salmon skin-side down and press gently with a spatula for 10 seconds. Cook undisturbed for 4 minutes until the skin is perfectly crisp.',
      'Mindful Glazing: Flip the fillets carefully. Brush the top generously with the miso glaze. The sugars in the glaze will caramelize quickly, so keep a close eye on the heat.',
      'Steam Greens: Add the halved baby bok choy to the same pan around the salmon. Add a tablespoon of water and cover with a lid for 2 minutes to steam-cook until tender-crisp.',
      'Harmony on a Plate: Arrange the greens as a base, place the glazed salmon atop, and sprinkle with toasted sesame seeds and perhaps a few drops of yuzu juice.'
    ]
  },
  {
    id: '4',
    name: 'Cold Soba with Shiso',
    jpName: '大葉としその信州蕎麦',
    calories: 280,
    protein: '10g',
    fat: '4g',
    carbs: '55g',
    time: '12 mins',
    servings: '1',
    difficulty: 'Easy',
    tags: ['Quick', 'Vegetarian'],
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=800',
    readyToCook: false,
    missingItems: 1,
    missingIngredients: ['Buckwheat Noodles (Soba)'],
    fullIngredients: [
      { name: 'Soba Noodles', quantity: '80g', inStock: 'OUT OF STOCK' },
      { name: 'Shiso Leaves', quantity: '4', inStock: 'IN STOCK' },
      { name: 'Tsuyu Sauce', quantity: '50ml', inStock: 'IN STOCK' }
    ],
    instructions: [
      'Respect the Noodle: Boil a large pot of water (no salt needed for soba). Add the noodles and keep them moving with chopsticks to prevent sticking. Cook for exactly 4-5 minutes until al dente.',
      'The Shock: Immediately drain and plunge the noodles into an ice-water bath. Use your hands to gently scrub the starch off the noodles under the water—this is crucial for that signature smooth texture.',
      'Aromatic Prep: Wash the shiso leaves, pat dry, stack them, and roll them tightly before slicing into hair-thin strips or "chiffonade".',
      'The Set: Arrange the chilled noodles on a bamboo mat (zaru). Serve with the cold dipping sauce (tsuyu) on the side, topped with the fresh shiso strips and an optional touch of wasabi.'
    ]
  }
];

export const FOOD_SHELF_LIFE: Record<string, number> = {
  'Milk': 7,
  'Organic Milk': 7,
  'Eggs': 21,
  'Chicken': 3,
  'Beef': 4,
  'Salmon': 2,
  'Avocado': 5,
  'Spinach': 5,
  'Carrots': 14,
  'Onions': 30,
  'Yogurt': 14,
  'Bread': 5,
  'Cheese': 21,
  'Apples': 30,
  'Bananas': 7,
  'Tomato': 7,
  'Cucumber': 7,
  'Broccoli': 7,
  'Butter': 60,
  'Tofu': 7
};
