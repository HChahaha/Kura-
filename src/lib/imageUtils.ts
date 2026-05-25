import { FOOD_SHELF_LIFE } from '../constants';

const FOOD_IMAGES: Record<string, string> = {
  milk: '1550583724-125581f77833',
  egg: '1582722872445-44dc5f7e3c8f',
  bread: '1509440159596-0249088772ff',
  avocado: '1523049673857-eb18f1d7b578',
  salmon: '1467003909585-2f8a72700288',
  tofu: '1512703306407-567ae823accc',
  silken: '1512703306407-567ae823accc',
  chicken: '1604908176997-125f25cc6f3d',
  steak: '1600891964599-f61ba0e24092',
  beef: '1514464750248-2428b835a941',
  pork: '1534177714521-729935105220',
  vegetable: '1566385278631-7b068d374421',
  fruit: '1610832958506-aa56368176cf',
  apple: '1560806887-1e4cd0b6bccb',
  banana: '1603833665858-e81b1c7e4a7b',
  berry: '1563234791-3843e9bd7550',
  strawberry: '1464965224031-83783e6fbbde',
  blueberry: '1498557850523-fd3d118b962e',
  spinach: '1576045057995-568f588f82fb',
  kale: '1576045057995-568f588f82fb',
  mushroom: '1504674900247-0877df9cc836',
  cheese: '1486297678162-ad2a19b05844',
  yogurt: '1488477181946-6428a0291777',
  butter: '1589985273302-c43b23998117',
  rice: '1586201375761-83865001e31c',
  pasta: '1473093226795-af9932fe5856',
  noodle: '1569562211093-4ed0d0758f12',
  flour: '1509440159596-0249088772ff',
  wine: '1510812431401-41d2bd2722f3',
  beer: '1535958636474-b021ee887b13',
  tomato: '1582284540020-8acaf01f55b1',
  potato: '1518977676601-b53f82aba655',
  onion: '1508747703725-719777637510',
  garlic: '1540148426945-6cf22a6b2383',
  miso: '1584270354807-686ca68252f3',
  matcha: '1582743949322-540211996ec0',
  sake: '1528433333455-074586badcc3',
  ginger: '1599940824399-b87987ceb72a',
  wasabi: '1615485499709-679905658e4b',
  nori: '1534422298391-e4f8c1109db0',
  seaweed: '1534422298391-e4f8c1109db0',
  wagyu: '1600891964599-f61ba0e24092',
  urchin: '1534422298391-e4f8c1109db0',
  coffee: '1509042239860-f550ce710b93',
  tea: '1544787210-2820059ac533',
  chocolate: '1511381939415-e44015466834',
  honey: '1473948472280-36306899f33a',
  lemon: '1512623483443-4f14ad446fca',
  orange: '1510333302154-7934c2386055',
  grape: '1533616688419-b7a585564566',
  kiwi: '1618897996318-7a9ed1b935e2',
  mango: '1553279766-db78cd697627',
  peach: '1629828859605-c1ee33c048bc',
  broccoli: '1459411555121-12c4cbb827b9',
  carrot: '1598170845058-32b996a688b5',
  cucumber: '1449339044714-231350485fc9',
  pepper: '1506368249639-73a05d6f6488',
  lettuce: '1622206143516-35b1d41ed60e',
  shrimp: '1565611108420-5616611481b7',
  pizza: '1513104894684-240726403c4f',
  'ice cream': '1497034841448-3a992b82f438',
  cake: '1535141123146-73843f922754',
  cookie: '1499636136210-65823d062e90'
};

const CATEGORY_IMAGES: Record<string, string> = {
  'Dairy & Eggs': '1488477181946-6428a0291777',
  'Vegetables': '1566385278631-7b068d374421',
  'Meat & Seafood': '1602491673980-73aa38de027a',
  'Pantry': '1586040140378-b5634cb4c8fc',
  'Grains': '1586201375761-83865001e31c',
  'Fruits': '1610832958506-aa56368176cf',
  'Bakery': '1509440159596-0249088772ff',
  'Frozen': '1519782482352-7301c37d0426'
};

const CATEGORY_MAP: Record<string, string[]> = {
  'Dairy & Eggs': ['milk', 'egg', 'cheese', 'yogurt', 'butter', 'cream', 'margarine', 'tofu'],
  'Vegetables': ['tomato', 'potato', 'onion', 'garlic', 'spinach', 'mushroom', 'carrot', 'broccoli', 'cucumber', 'pepper', 'lettuce', 'kale', 'avocado'],
  'Meat & Seafood': ['chicken', 'steak', 'beef', 'pork', 'salmon', 'tuna', 'fish', 'lamb', 'turkey', 'shrimp', 'crab'],
  'Pantry': ['honey', 'syrup', 'oil', 'vinegar', 'salt', 'sugar', 'spice', 'chocolate', 'coffee', 'tea', 'jam', 'sauce'],
  'Grains': ['rice', 'pasta', 'flour', 'cereal', 'oats', 'quinoa', 'noodle'],
  'Fruits': ['apple', 'banana', 'berry', 'strawberry', 'blueberry', 'lemon', 'orange', 'grape', 'kiwi', 'mango', 'peach', 'pear'],
  'Bakery': ['bread', 'bagel', 'croissant', 'muffin', 'cake', 'cookie', 'pastry'],
  'Frozen': ['pizza', 'ice cream', 'frozen', 'dumpling']
};

export function suggestCategory(name: string): string | null {
  const lowercaseName = name.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some(keyword => lowercaseName.includes(keyword))) {
      return category;
    }
  }
  return null;
}

export function getFoodIcon(name: string, category?: string): string {
  const lowercaseName = name.toLowerCase();
  if (lowercaseName.includes('milk')) return 'Milk';
  if (lowercaseName.includes('egg')) return 'Egg';
  if (lowercaseName.includes('bread')) return 'Bread';
  if (lowercaseName.includes('leaf') || lowercaseName.includes('spinach') || lowercaseName.includes('kale') || lowercaseName.includes('lettuce')) return 'Leaf';
  if (lowercaseName.includes('meat') || lowercaseName.includes('steak') || lowercaseName.includes('beef') || lowercaseName.includes('chicken')) return 'Drumstick';
  if (lowercaseName.includes('fish') || lowercaseName.includes('salmon')) return 'Fish';
  if (lowercaseName.includes('fruit') || lowercaseName.includes('apple') || lowercaseName.includes('orange')) return 'Apple';
  if (lowercaseName.includes('wine') || lowercaseName.includes('beer') || lowercaseName.includes('sake')) return 'Wine';
  if (lowercaseName.includes('coffee') || lowercaseName.includes('tea') || lowercaseName.includes('matcha')) return 'Coffee';
  
  // Category defaults
  if (category === 'Dairy & Eggs') return 'Milk';
  if (category === 'Vegetables') return 'Leaf';
  if (category === 'Meat & Seafood') return 'Drumstick';
  if (category === 'Fruits') return 'Apple';
  if (category === 'Bakery') return 'Croissant';
  
  return 'Utensils';
}

export function getFoodImage(name: string, category?: string): string {
  const lowercaseName = name.toLowerCase();
  
  // Try to find by direct name match or keyword
  for (const [key, id] of Object.entries(FOOD_IMAGES)) {
    if (lowercaseName.includes(key)) {
      return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=600`;
    }
  }
  
  // Try category fallback
  if (category && CATEGORY_IMAGES[category]) {
    return `https://images.unsplash.com/photo-${CATEGORY_IMAGES[category]}?auto=format&fit=crop&q=80&w=600`;
  }
  
  // Final fallback to a high-quality general food image
  return `https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600&food=${encodeURIComponent(name)}`;
}

export function getNormalShelfLife(name: string, category?: string): number {
  const lowercaseName = name.toLowerCase();
  
  // Try matching directly in FOOD_SHELF_LIFE keys (e.g. 'Milk', 'Eggs')
  for (const [key, days] of Object.entries(FOOD_SHELF_LIFE)) {
    if (lowercaseName.includes(key.toLowerCase())) {
      return days;
    }
  }
  
  // Try category-based fallback
  if (category) {
    const cat = category.toLowerCase();
    if (cat.includes('meat') || cat.includes('seafood')) return 3; // 3 days
    if (cat.includes('dairy') || cat.includes('egg')) return 7; // 7 days
    if (cat.includes('vegetable')) return 7; // 7 days
    if (cat.includes('fruit')) return 10; // 10 days
    if (cat.includes('bakery') || cat.includes('bread')) return 5; // 5 days
    if (cat.includes('pantry') || cat.includes('grain')) return 90; // 90 days
    if (cat.includes('frozen')) return 180; // 180 days
  }
  
  // Default fallback if absolutely nothing matches
  return 7; // default 7 days
}

