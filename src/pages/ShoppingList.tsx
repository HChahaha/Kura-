import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Search, Plus, Trash2, Calendar, Store, DollarSign, Archive, CheckCircle2, Circle, AlertCircle, ArrowUpRight, ChevronDown, ChevronUp, Tag, Apple, Carrot, Beef, Fish, Wheat, Milk, Flame, Package, Home, Tags, Crown, Camera, Receipt, CheckSquare } from 'lucide-react';
import { ShoppingItem, PurchaseRecord, View, InventoryItem } from '../types';
import { getNormalShelfLife, suggestCategory } from '../lib/imageUtils';

interface ShoppingListProps {
 shoppingList: ShoppingItem[];
 purchaseHistory: PurchaseRecord[];
 categories: string[];
 onAddShoppingItem: (item: ShoppingItem) => void;
 onUpdateShoppingItem: (id: string, updates: Partial<ShoppingItem>) => void;
 onDeleteShoppingItem: (id: string) => void;
 onAddPurchaseRecord: (record: PurchaseRecord) => void;
 onUpdatePurchaseRecord?: (id: string, updates: Partial<PurchaseRecord>) => void;
 onDeletePurchaseRecord?: (id: string) => void;
 onAddToInventory: (item: Omit<InventoryItem, 'id' | 'daysLeft' | 'isExpiringSoon'>) => void;
 onViewChange: (view: View) => void;
}

const getCategoryIcon = (category: string) => {
 const c = category.toLowerCase();
 if (c.includes('fruit')) return <Apple className="w-3 h-3" />;
 if (c.includes('veg')) return <Carrot className="w-3 h-3" />;
 if (c.includes('meat') || c.includes('beef') || c.includes('pork')) return <Beef className="w-3 h-3" />;
 if (c.includes('sea') || c.includes('fish')) return <Fish className="w-3 h-3" />;
 if (c.includes('grain') || c.includes('bread') || c.includes('baker')) return <Wheat className="w-3 h-3" />;
 if (c.includes('dairy') || c.includes('milk') || c.includes('egg')) return <Milk className="w-3 h-3" />;
 if (c.includes('frozen')) return <Flame className="w-3 h-3 text-cyan-500" />;
 if (c.includes('pantry')) return <Package className="w-3 h-3" />;
 if (c.includes('house') || c.includes('clean')) return <Home className="w-3 h-3" />;
 return <Tags className="w-3 h-3" />;
};

const UNITS = ['g', 'kg', 'lbs', 'ml', 'l', 'pcs', 'packs', 'cups', 'spoons', 'cans', 'bottles', 'bags', 'boxes'];

const ALL_DEALS: Record<string, any[]> = {
 'Canada': [
 { id: 'f1', storeName: 'T&T Supermarket', brand: 'Farm Fresh', name: 'Pork Ribs', price: '$2.99/lb', category: 'Meat' },
 { id: 'f2', storeName: 'T&T Supermarket', brand: 'Local', name: 'Napa Cabbage', price: '$0.99/lb', category: 'Vegetables' },
 { id: 'f3', storeName: 'Costco', brand: 'Kirkland Signature', name: 'Toilet Paper', price: '$19.99', category: 'Household' },
 { id: 'f4', storeName: 'Walmart', brand: 'Lucerne', name: '2% Milk', price: '$5.49', category: 'Dairy' },
 { id: 'f5', storeName: 'Superstore', brand: 'No Name', name: 'Avocados (Bag)', price: '$3.99', category: 'Vegetables' },
 { id: 'f6', storeName: 'FreshCo', brand: 'Maple Leaf', name: 'Chicken Breast', price: '$4.99/lb', category: 'Meat' },
 ],
 'United States': [
 { id: 'u1', storeName: 'Trader Joe\'s', brand: 'Trader Joe\'s', name: 'Organic Bananas', price: '$0.19/ea', category: 'Fruit' },
 { id: 'u2', storeName: 'Costco', brand: 'Kirkland', name: 'Rotisserie Chicken', price: '$4.99', category: 'Meat' },
 { id: 'u3', storeName: 'Kroger', brand: 'Simple Truth', name: 'Gala Apples', price: '$1.49/lb', category: 'Fruit' },
 { id: 'u4', storeName: 'Whole Foods', brand: '365', name: 'Grass-Fed Beef', price: '$6.99/lb', category: 'Meat' },
 { id: 'u5', storeName: 'Target', brand: 'Up&Up', name: 'Paper Towels', price: '$14.99', category: 'Household' },
 { id: 'u6', storeName: 'Walmart', brand: 'Great Value', name: 'Large Eggs', price: '$2.19/dz', category: 'Dairy' },
 ],
 'United Kingdom': [
 { id: 'k1', storeName: 'Tesco', brand: 'Tesco', name: 'Semi-Skimmed Milk', price: '£1.45', category: 'Dairy' },
 { id: 'k2', storeName: 'Sainsbury\'s', brand: 'Taste the Difference', name: 'Strawberries', price: '£2.00', category: 'Fruit' },
 { id: 'k3', storeName: 'Asda', brand: 'Asda', name: 'Cheddar Cheese', price: '£2.50', category: 'Dairy' },
 { id: 'k4', storeName: 'Waitrose', brand: 'Duchy Organic', name: 'Organic Salmon', price: '£4.99', category: 'Meat' },
 { id: 'k5', storeName: 'Aldi', brand: 'Nature\'s Pick', name: 'Carrots', price: '£0.45', category: 'Vegetables' },
 { id: 'k6', storeName: 'Lidl', brand: 'Rowan Hill', name: 'Sourdough Bread', price: '£1.10', category: 'Bread' },
 ],
 'Australia': [
 { id: 'a1', storeName: 'Woolworths', brand: 'Woolworths', name: 'Beef Mince', price: '$7.00/kg', category: 'Meat' },
 { id: 'a2', storeName: 'Coles', brand: 'Coles', name: 'Avocados', price: '$1.50/ea', category: 'Vegetables' },
 { id: 'a3', storeName: 'Aldi', brand: 'Farmdale', name: 'Milk 2L', price: '$3.10', category: 'Dairy' },
 { id: 'a4', storeName: 'IGA', brand: 'Arnott\'s', name: 'Tim Tams', price: '$4.00', category: 'Pantry' },
 { id: 'a5', storeName: 'Costco', brand: 'Kirkland Signature', name: 'Toilet Paper', price: '$25.99', category: 'Household' },
 { id: 'a6', storeName: 'Woolworths', brand: 'Odd Bunch', name: 'Apples', price: '$4.50/kg', category: 'Fruit' },
 ]
};

const VANCOUVER_FLYER_DATABASE = [
 // Milk
 { name: 'Oat Milk', storeName: 'Walmart', brand: "Earth's Own", price: 3.49, category: 'Dairy', raw_unit_text: '1.75L', original_title: "Earth's Own Oat Milk" },
 { name: 'Oat Milk', storeName: 'Real Canadian Superstore', brand: "Earth's Own", price: 3.79, category: 'Dairy', raw_unit_text: '1.75L', original_title: "Earth's Own Oat Milk" },
 { name: 'Oat Milk', storeName: 'T&T Supermarket', brand: "Earth's Own", price: 4.29, category: 'Dairy', raw_unit_text: '1.75L', original_title: "Earth's Own Oat Milk" },
 { name: 'Oat Milk', storeName: 'Costco', brand: "Earth's Own", price: 2.99, category: 'Dairy', raw_unit_text: '1.75L', original_title: "Earth's Own Oat Milk" },

 { name: '2% Milk', storeName: 'Walmart', brand: 'Dairyland', price: 4.89, category: 'Dairy', raw_unit_text: '4L', original_title: 'Dairyland 2% Milk' },
 { name: '2% Milk', storeName: 'Real Canadian Superstore', brand: 'Dairyland', price: 4.99, category: 'Dairy', raw_unit_text: '4L', original_title: 'Dairyland 2% Milk' },
 { name: '2% Milk', storeName: 'T&T Supermarket', brand: 'Dairyland', price: 5.49, category: 'Dairy', raw_unit_text: '4L', original_title: 'Dairyland 2% Milk' },
 { name: '2% Milk', storeName: 'Costco', brand: 'Dairyland', price: 4.49, category: 'Dairy', raw_unit_text: '4L', original_title: 'Dairyland 2% Milk' },

 // Eggs
 { name: 'Large Eggs', storeName: 'Walmart', brand: 'GoldEgg', price: 4.29, category: 'Dairy', raw_unit_text: '12pcs', original_title: 'GoldEgg Large Eggs' },
 { name: 'Large Eggs', storeName: 'Real Canadian Superstore', brand: 'GoldEgg', price: 4.49, category: 'Dairy', raw_unit_text: '12pcs', original_title: 'GoldEgg Large Eggs' },
 { name: 'Large Eggs', storeName: 'T&T Supermarket', brand: 'GoldEgg', price: 4.99, category: 'Dairy', raw_unit_text: '12pcs', original_title: 'GoldEgg Large Eggs' },
 { name: 'Large Eggs', storeName: 'Costco', brand: 'GoldEgg', price: 9.99, category: 'Dairy', raw_unit_text: '30pcs', original_title: 'GoldEgg Large Eggs' },

 // Avocados
 { name: 'Avocados', storeName: 'Costco', brand: 'Del Monte', price: 4.99, category: 'Vegetables', raw_unit_text: '5pcs', original_title: 'Del Monte Avocados' },
 { name: 'Avocados', storeName: 'Walmart', brand: 'Del Monte', price: 1.25, category: 'Vegetables', raw_unit_text: 'each', original_title: 'Del Monte Avocados' },
 { name: 'Avocados', storeName: 'Real Canadian Superstore', brand: 'Del Monte', price: 0.88, category: 'Vegetables', raw_unit_text: 'each', original_title: 'Del Monte Avocados' },
 { name: 'Avocados', storeName: 'T&T Supermarket', brand: 'Del Monte', price: 1.49, category: 'Vegetables', raw_unit_text: 'each', original_title: 'Del Monte Avocados' },

 // Napa Cabbage
 { name: 'Napa Cabbage', storeName: 'T&T Supermarket', brand: 'Grown in BC', price: 0.88, category: 'Vegetables', raw_unit_text: 'lb', original_title: 'Grown in BC Napa Cabbage' },
 { name: 'Napa Cabbage', storeName: 'Real Canadian Superstore', brand: 'Grown in BC', price: 1.19, category: 'Vegetables', raw_unit_text: 'lb', original_title: 'Grown in BC Napa Cabbage' },
 { name: 'Napa Cabbage', storeName: 'Walmart', brand: 'Grown in BC', price: 1.49, category: 'Vegetables', raw_unit_text: 'lb', original_title: 'Grown in BC Napa Cabbage' },
 { name: 'Napa Cabbage', storeName: 'Costco', brand: 'Grown in BC', price: 1.29, category: 'Vegetables', raw_unit_text: 'lb', original_title: 'Grown in BC Napa Cabbage' },

 // Pork Ribs
 { name: 'Pork Ribs', storeName: 'T&T Supermarket', brand: 'Maple Leaf', price: 2.88, category: 'Meat', raw_unit_text: 'lb', original_title: 'Maple Leaf Pork Ribs' },
 { name: 'Pork Ribs', storeName: 'Real Canadian Superstore', brand: 'Maple Leaf', price: 3.29, category: 'Meat', raw_unit_text: 'lb', original_title: 'Maple Leaf Pork Ribs' },
 { name: 'Pork Ribs', storeName: 'Walmart', brand: 'Maple Leaf', price: 3.49, category: 'Meat', raw_unit_text: 'lb', original_title: 'Maple Leaf Pork Ribs' },
 { name: 'Pork Ribs', storeName: 'Costco', brand: 'Maple Leaf', price: 2.99, category: 'Meat', raw_unit_text: 'lb', original_title: 'Maple Leaf Pork Ribs' },

 // Tofu
 { name: 'Tofu', storeName: 'T&T Supermarket', brand: 'Sunrise', price: 1.69, category: 'Pantry', raw_unit_text: '350g', original_title: 'Sunrise Tofu' },
 { name: 'Tofu', storeName: 'Real Canadian Superstore', brand: 'Sunrise', price: 1.99, category: 'Pantry', raw_unit_text: '350g', original_title: 'Sunrise Tofu' },
 { name: 'Tofu', storeName: 'Walmart', brand: 'Sunrise', price: 1.88, category: 'Pantry', raw_unit_text: '350g', original_title: 'Sunrise Tofu' },
 { name: 'Tofu', storeName: 'Costco', brand: 'Sunrise', price: 1.50, category: 'Pantry', raw_unit_text: '350g', original_title: 'Sunrise Tofu' },

 // Miso Paste
 { name: 'Miso Paste', storeName: 'T&T Supermarket', brand: 'Hikari', price: 3.99, category: 'Pantry', raw_unit_text: '400g', original_title: 'Hikari Miso Paste' },
 { name: 'Miso Paste', storeName: 'Real Canadian Superstore', brand: 'Hikari', price: 4.49, category: 'Pantry', raw_unit_text: '400g', original_title: 'Hikari Miso Paste' },
 { name: 'Miso Paste', storeName: 'Walmart', brand: 'Hikari', price: 4.89, category: 'Pantry', raw_unit_text: '400g', original_title: 'Hikari Miso Paste' },
 { name: 'Miso Paste', storeName: 'Costco', brand: 'Hikari', price: 5.29, category: 'Pantry', raw_unit_text: '400g', original_title: 'Hikari Miso Paste' },

 // Chicken Breast
 { name: 'Chicken Breast', storeName: 'Walmart', brand: 'Maple Leaf', price: 4.99, category: 'Meat', raw_unit_text: 'lb', original_title: 'Maple Leaf Chicken Breast' },
 { name: 'Chicken Breast', storeName: 'Real Canadian Superstore', brand: 'Maple Leaf', price: 5.49, category: 'Meat', raw_unit_text: 'lb', original_title: 'Maple Leaf Chicken Breast' },
 { name: 'Chicken Breast', storeName: 'T&T Supermarket', brand: 'Maple Leaf', price: 5.99, category: 'Meat', raw_unit_text: 'lb', original_title: 'Maple Leaf Chicken Breast' },
 { name: 'Chicken Breast', storeName: 'Costco', brand: 'Maple Leaf', price: 4.79, category: 'Meat', raw_unit_text: 'lb', original_title: 'Maple Leaf Chicken Breast' },

 // Salmon
 { name: 'Salmon Fillet', storeName: 'T&T Supermarket', brand: 'Fresh Catch', price: 11.99, category: 'Meat', raw_unit_text: 'lb', original_title: 'Fresh Catch Salmon Fillet' },
 { name: 'Salmon Fillet', storeName: 'Real Canadian Superstore', brand: 'Fresh Catch', price: 12.49, category: 'Meat', raw_unit_text: 'lb', original_title: 'Fresh Catch Salmon Fillet' },
 { name: 'Salmon Fillet', storeName: 'Walmart', brand: 'Fresh Catch', price: 12.99, category: 'Meat', raw_unit_text: 'lb', original_title: 'Fresh Catch Salmon Fillet' },
 { name: 'Salmon Fillet', storeName: 'Costco', brand: 'Fresh Catch', price: 10.99, category: 'Meat', raw_unit_text: 'lb', original_title: 'Fresh Catch Salmon Fillet' },

 // Apples
 { name: 'Gala Apples', storeName: 'Real Canadian Superstore', brand: 'BC Tree Fruit', price: 1.29, category: 'Fruit', raw_unit_text: 'lb', original_title: 'BC Tree Fruit Gala Apples' },
 { name: 'Gala Apples', storeName: 'Walmart', brand: 'BC Tree Fruit', price: 1.49, category: 'Fruit', raw_unit_text: 'lb', original_title: 'BC Tree Fruit Gala Apples' },
 { name: 'Gala Apples', storeName: 'T&T Supermarket', brand: 'BC Tree Fruit', price: 1.69, category: 'Fruit', raw_unit_text: 'lb', original_title: 'BC Tree Fruit Gala Apples' },
 { name: 'Gala Apples', storeName: 'Costco', brand: 'BC Tree Fruit', price: 0.99, category: 'Fruit', raw_unit_text: 'lb', original_title: 'BC Tree Fruit Gala Apples' },

 // Bananas
 { name: 'Bananas', storeName: 'Walmart', brand: 'Chiquita', price: 0.69, category: 'Fruits', raw_unit_text: 'lb', original_title: 'Chiquita Bananas' },
 { name: 'Bananas', storeName: 'Real Canadian Superstore', brand: 'Chiquita', price: 0.69, category: 'Fruits', raw_unit_text: 'lb', original_title: 'Chiquita Bananas' },
 { name: 'Bananas', storeName: 'T&T Supermarket', brand: 'Chiquita', price: 0.79, category: 'Fruits', raw_unit_text: 'lb', original_title: 'Chiquita Bananas' },
 { name: 'Bananas', storeName: 'Costco', brand: 'Dolco', price: 1.99, category: 'Fruits', raw_unit_text: '3lb bag', original_title: 'Dolco Bananas 3lb bag' },

 // Sekka Rice Bulk (6.8kg)
 { name: 'Sekka Rice', storeName: 'T&T Supermarket', brand: 'Sekka', price: 17.88, category: 'Pantry', raw_unit_text: '6.8kg bag', original_title: 'Sekka Rice 6.8kg' },
 { name: 'Sekka Rice', storeName: 'Real Canadian Superstore', brand: 'Sekka', price: 18.50, category: 'Pantry', raw_unit_text: '6.8kg bag', original_title: 'Sekka Rice 6.8kg' },
 { name: 'Sekka Rice', storeName: 'Walmart', brand: 'Sekka', price: 18.99, category: 'Pantry', raw_unit_text: '6.8kg bag', original_title: 'Sekka Rice 6.8kg' },
 { name: 'Sekka Rice', storeName: 'Costco', brand: 'Sekka', price: 16.49, category: 'Pantry', raw_unit_text: '6.8kg bag', original_title: 'Sekka Rice 6.8kg' },

 // Sekka Rice Small Pouch (250g)
 { name: 'Sekka Rice', storeName: 'T&T Supermarket', brand: 'Sekka', price: 3.99, category: 'Pantry', raw_unit_text: '250g pouch', original_title: 'Sekka Rice 250g' },
 { name: 'Sekka Rice', storeName: 'Real Canadian Superstore', brand: 'Sekka', price: 4.25, category: 'Pantry', raw_unit_text: '250g pouch', original_title: 'Sekka Rice 250g' },
 { name: 'Sekka Rice', storeName: 'Walmart', brand: 'Sekka', price: 4.50, category: 'Pantry', raw_unit_text: '250g pouch', original_title: 'Sekka Rice 250g' },
 { name: 'Sekka Rice', storeName: 'Costco', brand: 'Sekka', price: 3.49, category: 'Pantry', raw_unit_text: '250g pouch', original_title: 'Sekka Rice 250g' },

 // Jasmine Rice
 { name: 'Jasmine Rice', storeName: 'T&T Supermarket', brand: 'Rooster', price: 15.88, category: 'Pantry', raw_unit_text: '8kg bag', original_title: 'Rooster Jasmine Rice' },
 { name: 'Jasmine Rice', storeName: 'Real Canadian Superstore', brand: 'Rooster', price: 16.99, category: 'Pantry', raw_unit_text: '8kg bag', original_title: 'Rooster Jasmine Rice' },
 { name: 'Jasmine Rice', storeName: 'Walmart', brand: 'Rooster', price: 17.49, category: 'Pantry', raw_unit_text: '8kg bag', original_title: 'Rooster Jasmine Rice' },
 { name: 'Jasmine Rice', storeName: 'Costco', brand: 'Rooster', price: 14.99, category: 'Pantry', raw_unit_text: '8kg bag', original_title: 'Rooster Jasmine Rice' },

 // Spinach
 { name: 'Baby Spinach', storeName: 'Walmart', brand: "Olivia's Organics", price: 2.99, category: 'Vegetables', raw_unit_text: '142g pack', original_title: "Olivia's Organics Baby Spinach" },
 { name: 'Baby Spinach', storeName: 'Real Canadian Superstore', brand: "Olivia's Organics", price: 3.29, category: 'Vegetables', raw_unit_text: '142g pack', original_title: "Olivia's Organics Baby Spinach" },
 { name: 'Baby Spinach', storeName: 'T&T Supermarket', brand: "Olivia's Organics", price: 3.49, category: 'Vegetables', raw_unit_text: '142g pack', original_title: "Olivia's Organics Baby Spinach" },
 { name: 'Baby Spinach', storeName: 'Costco', brand: "Olivia's Organics", price: 2.49, category: 'Vegetables', raw_unit_text: '142g pack', original_title: "Olivia's Organics Baby Spinach" }
];

const parsePrice = (priceStr: string): number => {
 if (!priceStr) return 999.99;
 const match = priceStr.match(/\d+(\.\d+)?/);
 return match ? parseFloat(match[0]) : 999.99;
};

const formatPrice = (priceStr: string): string => {
 if (!priceStr) return '';
 const num = parsePrice(priceStr);
 if (num === 999.99) return priceStr;
 return `$${num.toFixed(2)}`;
};

const formatPriceForDisplay = (price: number): string => {
 return `$${price.toFixed(2)}`;
};

const parseFlyerUnit = (
 total_price: number,
 rawUnitText: string,
 itemTitle: string
): {
 pack_multiplier: number;
 base_unit: string;
 normalized_unit_price: number;
} => {
 let str = (rawUnitText || "").trim().toLowerCase();
 if (!str) {
 str = itemTitle.trim().toLowerCase();
 }

 let pack_multiplier = 1;
 let base_unit = "pc";

 // Match multiplier patterns like: "3x 1.75L", "3 x 1.75 L", "2x 4L"
 const multSubunitRegex = /(\d+)\s*(?:x|\*)\s*(\d+(?:\.\d+)?\s*[a-zA-Z]+)/i;
 const multSubunitMatch = str.match(multSubunitRegex);

 // Match pack count patterns like: "30pcs", "2-pack", "12 rolls", "12 pack", "2pk"
 const packRegex = /(\d+)\s*(?:-|–|\s)*(pcs|pc|pack|pk|roll|rolls|box|boxes|bag|bags|bottle|bottles|can|cans|piece|pieces|ea|each|sheet|sheets|pouch|pouches|tub|tubs|dz|dozen)\b/i;
 const packMatch = str.match(packRegex);

 // Match weight/volume with integer amount like "5 kg", "10 kg", "3 lb", "4L"
 const weightVolRegex = /(\d+)\s*(kg|g|l|ml|lbs|lb|oz)\b/i;
 const weightVolMatch = str.match(weightVolRegex);

 // Fallback match float weights/volumes like "1.75L", "6.8kg", "350g" as total 1 package with that float as unit
 const floatRegex = /(\d+(?:\.\d+)?)\s*(kg|g|l|ml|lbs|lb|oz)\b/i;
 const floatMatch = str.match(floatRegex);

 if (multSubunitMatch) {
 pack_multiplier = parseInt(multSubunitMatch[1], 10);
 base_unit = multSubunitMatch[2].trim();
 } else if (packMatch) {
 pack_multiplier = parseInt(packMatch[1], 10);
 const matchedUnit = packMatch[2].trim().toLowerCase();
 // Normalize plural units for standard representation
 if (["pcs", "pc", "piece", "pieces", "ea", "each"].includes(matchedUnit)) {
 base_unit = "pc";
 } else if (["rolls", "roll"].includes(matchedUnit)) {
 base_unit = "roll";
 } else if (["pack", "packs", "pk", "pks"].includes(matchedUnit)) {
 base_unit = "pack";
 } else if (["boxes", "box"].includes(matchedUnit)) {
 base_unit = "box";
 } else if (["cans", "can"].includes(matchedUnit)) {
 base_unit = "can";
 } else if (["bags", "bag"].includes(matchedUnit)) {
 base_unit = "bag";
 } else if (["pouches", "pouch"].includes(matchedUnit)) {
 base_unit = "pouch";
 } else if (["bottles", "bottle"].includes(matchedUnit)) {
 base_unit = "bottle";
 } else if (["tubs", "tub"].includes(matchedUnit)) {
 base_unit = "tub";
 } else if (["sheets", "sheet"].includes(matchedUnit)) {
 base_unit = "sheet";
 } else {
 base_unit = matchedUnit;
 }
 } else if (weightVolMatch) {
 pack_multiplier = parseInt(weightVolMatch[1], 10);
 base_unit = weightVolMatch[2].trim().toLowerCase();
 } else if (floatMatch) {
 pack_multiplier = 1;
 base_unit = floatMatch[1] + floatMatch[2]; // e.g. "1.75l", "6.8kg"
 } else {
 pack_multiplier = 1;
 base_unit = str ? str.replace(/bag|box|pack/g, "").trim().toLowerCase() : "pc";
 if (!base_unit) base_unit = "pc";
 }

 if (isNaN(pack_multiplier) || pack_multiplier <= 0) {
 pack_multiplier = 1;
 }

 const normalized_unit_price = total_price / pack_multiplier;

 return {
 pack_multiplier,
 base_unit,
 normalized_unit_price
 };
};

const parseSizeOrTier = (name: string, priceStr?: string, quantityStr?: string) => {
 const combined = `${name} ${quantityStr || ''}`.toLowerCase();
 
 if (combined.includes('6.8kg') || combined.includes('6.8 kg') || combined.includes('8kg') || combined.includes('10kg') || combined.includes('bulk') || combined.includes('large')) {
 return 'large-bulk';
 }
 if (combined.includes('250g') || combined.includes('350g') || combined.includes('400g') || combined.includes('142g') || combined.includes('pouch') || combined.includes('small')) {
 return 'small-single';
 }
 if (combined.includes('1.75l') || combined.includes('1.89l') || combined.includes('2l')) {
 return 'medium';
 }
 if (combined.includes('4l')) {
 return 'large-bulk';
 }
 if (combined.includes('/lb') || combined.includes('per lb') || combined.includes('lb')) {
 return 'per-lb';
 }
 if (combined.includes('/dz') || combined.includes('dozen') || combined.includes('12pcs') || combined.includes('12 pack')) {
 return 'dozen';
 }

 if (priceStr) {
 const numPrice = parsePrice(priceStr);
 if (combined.includes('rice') || combined.includes('sekka')) {
 if (numPrice >= 10) return 'large-bulk';
 return 'small-single';
 }
 }

 if (combined.includes('cabbage') || combined.includes('ribs') || combined.includes('breast') || combined.includes('fillet') || combined.includes('apples') || combined.includes('salmon')) {
 return 'per-lb';
 }
 if (combined.includes('eggs')) {
 return 'dozen';
 }

 return 'standard';
};

const parseUnitSizeFromQuery = (queryText: string): { baseName: string; unitSize?: string } => {
 const regex = /\b(\d+(?:\.\d+)?\s*(?:kg|g|l|ml|lbs|pcs|oz|dz|ea))\b/i;
 const match = queryText.match(regex);
 if (match) {
 const size = match[1].replace(/\s+/g, '').toLowerCase();
 const base = queryText.replace(match[0], '').trim().replace(/\s+/g, ' ');
 return { baseName: base, unitSize: size };
 }
 return { baseName: queryText };
};

const getStablePriceForQuery = (name: string, storeIndex: number): string => {
 let hash = 0;
 for (let i = 0; i < name.length; i++) {
 hash = name.charCodeAt(i) + ((hash << 5) - hash);
 }
 hash = Math.abs(hash);
 const baseValue = 1.49 + (hash % 11) + ((hash % 100) / 100);
 const offsets = [-0.50, -0.15, 0.20, 0.10];
 const offset = offsets[storeIndex % 4];
 const priceVal = Math.max(0.69, parseFloat((baseValue + offset).toFixed(2)));
 return `$${priceVal}`;
};

const getVancouverStoreDeals = (queryText: string, targetSizeTier?: string, specificUnitSize?: string) => {
 const normalizedQuery = queryText.trim().toLowerCase();
 
 const stores = [
 { name: 'Costco', category: 'Pantry' },
 { name: 'T&T Supermarket', category: 'Pantry' },
 { name: 'Real Canadian Superstore', category: 'Pantry' },
 { name: 'Walmart', category: 'Pantry' }
 ];

 const enrichAndSortDeals = (dealsList: any[]) => {
 const enriched = dealsList.map(deal => {
 const parsed = parseFlyerUnit(deal.price, deal.raw_unit_text || '', deal.name || '');
 return {
 ...deal,
 pack_multiplier: parsed.pack_multiplier,
 base_unit: parsed.base_unit,
 normalized_unit_price: parsed.normalized_unit_price
 };
 });
 return enriched.sort((a, b) => a.normalized_unit_price - b.normalized_unit_price);
 };

 if (!normalizedQuery) {
 const defaultDeals = [
 { id: 'v-cabbage-0', storeName: 'T&T Supermarket', name: 'Grown in BC Napa Cabbage', brand: 'Grown in BC', price: 0.88, category: 'Vegetables', raw_unit_text: 'lb' },
 { id: 'v-cabbage-1', storeName: 'Real Canadian Superstore', name: 'Grown in BC Napa Cabbage', brand: 'Grown in BC', price: 1.19, category: 'Vegetables', raw_unit_text: 'lb' },
 { id: 'v-cabbage-2', storeName: 'Costco', name: 'Grown in BC Napa Cabbage', brand: 'Grown in BC', price: 1.29, category: 'Vegetables', raw_unit_text: 'lb' },
 { id: 'v-cabbage-3', storeName: 'Walmart', name: 'Grown in BC Napa Cabbage', brand: 'Grown in BC', price: 1.49, category: 'Vegetables', raw_unit_text: 'lb' }
 ];
 return enrichAndSortDeals(defaultDeals);
 }

 const parsedQuery = parseUnitSizeFromQuery(queryText);
 const queryBase = parsedQuery.baseName.trim().toLowerCase();

 const allProductMatches = VANCOUVER_FLYER_DATABASE.filter(item => 
 item.name.toLowerCase().includes(queryBase) || 
 queryBase.includes(item.name.toLowerCase())
 );

 let matchedItemName = parsedQuery.baseName;
 let detectedCategory = 'Pantry';

 if (allProductMatches.length > 0) {
 const exact = allProductMatches.find(m => m.name.toLowerCase() === queryBase);
 matchedItemName = exact ? exact.name : allProductMatches[0].name;
 detectedCategory = exact ? exact.category : allProductMatches[0].category;
 } else {
 const sug = suggestCategory(queryText);
 if (sug) detectedCategory = sug;
 }

 if (allProductMatches.length === 0) {
 matchedItemName = parsedQuery.baseName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
 }

 const finalDeals = stores.map((store, index) => {
 const storeMatches = allProductMatches.filter(item => 
 item.storeName === store.name && 
 item.name.toLowerCase() === matchedItemName.toLowerCase()
 );

 let existing: typeof VANCOUVER_FLYER_DATABASE[0] | undefined;

 if (storeMatches.length > 0) {
 if (specificUnitSize) {
 existing = storeMatches.find(m => m.raw_unit_text?.toLowerCase() === specificUnitSize.toLowerCase());
 }
 if (!existing && targetSizeTier) {
 existing = storeMatches.find(m => parseSizeOrTier(m.name, undefined, m.raw_unit_text) === targetSizeTier);
 }
 if (!existing && parsedQuery.unitSize) {
 existing = storeMatches.find(m => m.raw_unit_text?.toLowerCase() === parsedQuery.unitSize.toLowerCase());
 }
 if (!existing) {
 existing = storeMatches[0];
 }
 }

 if (existing) {
 return {
 id: `v-db-${store.name}-${matchedItemName}-${existing.raw_unit_text}`.replace(/\s+/g, '-'),
 storeName: existing.storeName,
 name: existing.original_title,
 brand: existing.brand || '',
 price: existing.price,
 category: existing.category,
 raw_unit_text: existing.raw_unit_text || ''
 };
 } else {
 const generatedPriceStr = getStablePriceForQuery(matchedItemName, index);
 const generatedPriceNum = parsePrice(generatedPriceStr);
 const generatedUnit = specificUnitSize || parsedQuery.unitSize || (allProductMatches.length > 0 ? allProductMatches[0].raw_unit_text : '') || '';
 return {
 id: `v-gen-${store.name}-${matchedItemName}-${generatedUnit}`.replace(/\s+/g, '-'),
 storeName: store.name,
 name: matchedItemName,
 brand: '',
 price: generatedPriceNum,
 category: detectedCategory,
 raw_unit_text: generatedUnit
 };
 }
 });

 return enrichAndSortDeals(finalDeals);
};

const getFlyerDeals = () => {
 const region = localStorage.getItem('shopping_country') || 'Canada';
 return ALL_DEALS[region] || ALL_DEALS['Canada'];
};

export default function ShoppingList({
 shoppingList,
 purchaseHistory,
 categories,
 onAddShoppingItem,
 onUpdateShoppingItem,
 onDeleteShoppingItem,
 onAddPurchaseRecord,
 onUpdatePurchaseRecord,
 onDeletePurchaseRecord,
 onAddToInventory,
 onViewChange
}: ShoppingListProps) {
 const [newItemName, setNewItemName] = useState('');
 const [newItemAmount, setNewItemAmount] = useState('1');
 const [newItemPrice, setNewItemPrice] = useState('');
 const [newStoreName, setNewStoreName] = useState('');
 const [selectedCategory, setSelectedCategory] = useState('Pantry');
 const [searchHistoryQuery, setSearchHistoryQuery] = useState('');

 // Custom purchase details state
 const [activeCompletingItem, setActiveCompletingItem] = useState<ShoppingItem | null>(null);
 const [editingHistoryItem, setEditingHistoryItem] = useState<PurchaseRecord | null>(null);
 const [storeName, setStoreName] = useState('');
 const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
 const [price, setPrice] = useState('');
 const [quantityBought, setQuantityBought] = useState('1');
 const [unitBought, setUnitBought] = useState('pcs');
 const [isUnitOpen, setIsUnitOpen] = useState(false);
 const [expiryDate, setExpiryDate] = useState('');
 const [autoAddInventory, setAutoAddInventory] = useState(true);
 const [hasManuallySelectedBuyCategory, setHasManuallySelectedBuyCategory] = useState(false);
 const [editingItemId, setEditingItemId] = useState<string | null>(null);
 const [editItemName, setEditItemName] = useState('');
 const [editItemAmount, setEditItemAmount] = useState('1');
 const [editItemPrice, setEditItemPrice] = useState('');
 const [editStoreName, setEditStoreName] = useState('');
 const [editCategory, setEditCategory] = useState('');

 const [addedDeals, setAddedDeals] = useState<string[]>([]);
 const [selectedHistoryItemName, setSelectedHistoryItemName] = useState<string | null>(null);

 const [activeStoreTab, setActiveStoreTab] = useState('All');
 const [customStoreTabs, setCustomStoreTabs] = useState<string[]>(['Walmart', 'T&T Supermarket']);
 const [isAddingStoreTab, setIsAddingStoreTab] = useState(false);
 const [newStoreTabName, setNewStoreTabName] = useState('');

 const [expandedPriceMatcherItem, setExpandedPriceMatcherItem] = useState<string | null>(null);
 const [priceMatcherSearch, setPriceMatcherSearch] = useState('');
 const [selectedSizeByItem, setSelectedSizeByItem] = useState<Record<string, string>>({});
 const [isPriceHistoryOpen, setIsPriceHistoryOpen] = useState(false);
 const [showAllHistory, setShowAllHistory] = useState(false);

 const activeToBuy = React.useMemo(() => {
 return Array.from(new Set(shoppingList.filter(item => !item.checked).map(item => item.name.trim())));
 }, [shoppingList]);

 const popularItems = React.useMemo(() => {
 const historyNames = purchaseHistory.map(h => h.name.trim());
 const counts: Record<string, number> = {};
 historyNames.forEach(name => {
 counts[name] = (counts[name] || 0) + 1;
 });
 const sortedHistory = Object.entries(counts)
 .sort((a, b) => b[1] - a[1])
 .map(([name]) => name);

 const defaultFlyerItems = [
 'Oat Milk',
 '2% Milk',
 'Large Eggs',
 'Avocados',
 'Napa Cabbage',
 'Chicken Breast',
 'Pork Ribs',
 'Tofu',
 'Baby Spinach'
 ];
 const combined = Array.from(new Set([...sortedHistory, ...defaultFlyerItems]));
 const activeSet = new Set(activeToBuy.map(name => name.toLowerCase()));
 return combined.filter(item => !activeSet.has(item.toLowerCase())).slice(0, 6);
 }, [purchaseHistory, activeToBuy]);

 const itemsToDisplay = React.useMemo(() => {
 const query = priceMatcherSearch.trim().toLowerCase();
 if (!query) {
 return {
 toBuy: activeToBuy,
 popular: []
 };
 }

 // Find matches in Vancouver database
 const dbMatches = Array.from(new Set(
 VANCOUVER_FLYER_DATABASE
 .filter(item => item.name.toLowerCase().includes(query))
 .map(item => item.name)
 ));

 // If no direct database item matches, we include the typed query as a capitalized option
 if (dbMatches.length === 0) {
 const capitalized = priceMatcherSearch.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
 dbMatches.push(capitalized);
 }

 return {
 toBuy: dbMatches,
 popular: []
 };
 }, [priceMatcherSearch, activeToBuy]);
 
 const vancouverDeals = React.useMemo(() => {
 return getVancouverStoreDeals(newItemName);
 }, [newItemName]);

 const handleAddVancouverDeal = (deal: { id: string; storeName: string; name: string; brand?: string; price: number; category: string; raw_unit_text?: string; pack_multiplier?: number; base_unit?: string; normalized_unit_price?: number }) => {
 const finalName = deal.brand ? `[${deal.brand}] ${deal.name}` : deal.name;
 const finalPriceVal = formatPriceForDisplay(deal.price);
 const finalPrice = deal.raw_unit_text ? `${finalPriceVal} / ${deal.raw_unit_text}` : finalPriceVal;
 onAddShoppingItem({ 
 id: Math.random().toString(36).substring(7), 
 name: finalName, 
 category: deal.category, 
 checked: false, 
 price: finalPrice, 
 storeName: deal.storeName,
 amount: '1'
 } as ShoppingItem);
 
 setAddedDeals(prev => [...prev, deal.id]);
 setTimeout(() => {
 setAddedDeals(prev => prev.filter(id => id !== deal.id));
 }, 2000);
 };

 const startEditingItem = (item: ShoppingItem) => {
 setEditingItemId(item.id);
 setEditItemName(item.name);
 setEditItemAmount(item.amount || '1');
 setEditItemPrice(item.price || '');
 setEditStoreName(item.storeName || '');
 setEditCategory(item.category);
 };

 const saveEditItem = () => {
 if (editingItemId && editItemName.trim()) {
 onUpdateShoppingItem(editingItemId, {
 name: editItemName.trim(),
 amount: editItemAmount.trim(),
 price: editItemPrice.trim(),
 storeName: editStoreName.trim(),
 category: editCategory
 });
 }
 setEditingItemId(null);
 };

 const normalizeItemName = (name: string) => name.replace(/\s+/g, '').toLowerCase();

 const priceHistoryText = React.useMemo(() => {
 if (!newItemName.trim() || newItemName.length < 2) return null;
 const history = purchaseHistory.filter(record => normalizeItemName(record.name) === normalizeItemName(newItemName));
 if (history.length === 0) {
 if (normalizeItemName(newItemName).includes('milk')) {
 return '$5.49 at Walmart';
 }
 return null;
 }

 let lowestRecord = history[0];
 const getNum = (p: string) => {
 const match = p.match(/\d+(\.\d+)?/);
 return match ? parseFloat(match[0]) : Infinity;
 };
 
 history.forEach(r => {
 if (getNum(r.price) < getNum(lowestRecord.price)) {
 lowestRecord = r;
 }
 });

 return `${lowestRecord.price} at ${lowestRecord.storeName}`;
 }, [newItemName, purchaseHistory]);

 const getLowestHistoricalPrice = (itemName: string) => {
 if (!itemName?.trim() || itemName.length < 2) return null;
 const history = purchaseHistory.filter(record => normalizeItemName(record.name) === normalizeItemName(itemName));
 if (history.length === 0) return null;

 let lowestRecord = history[0];
 const getNum = (p: string) => {
 const match = p.match(/\d+(\.\d+)?/);
 return match ? parseFloat(match[0]) : Infinity;
 };
 
 history.forEach(r => {
 if (getNum(r.price) < getNum(lowestRecord.price)) {
 lowestRecord = r;
 }
 });
 return lowestRecord;
 };

 const selectedHistoryData = React.useMemo(() => {
 if (!selectedHistoryItemName) return { records: [], lowestRecordId: '' };
 
 const records = purchaseHistory.filter(record => 
 normalizeItemName(record.name) === normalizeItemName(selectedHistoryItemName)
 );
 
 records.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
 
 const getNum = (p: string) => {
 const match = p.match(/\d+(\.\d+)?/);
 return match ? parseFloat(match[0]) : Infinity;
 };
 
 let lowestRecordId = '';
 if (records.length > 0) {
 let lowestRecord = records[0];
 records.forEach(r => {
 if (getNum(r.price) < getNum(lowestRecord.price)) {
 lowestRecord = r;
 }
 });
 lowestRecordId = lowestRecord.id;
 }
 
 return { records, lowestRecordId };
 }, [selectedHistoryItemName, purchaseHistory]);

 useEffect(() => {
 if (newItemName.length > 2 && !hasManuallySelectedBuyCategory) {
 const suggestion = suggestCategory(newItemName);
 if (suggestion) {
 setSelectedCategory(suggestion);
 }
 }
 }, [newItemName, hasManuallySelectedBuyCategory]);

 useEffect(() => {
 if (activeCompletingItem && activeCompletingItem.id === 'direct-purchase' && activeCompletingItem.name.length > 2) {
 const suggestion = suggestCategory(activeCompletingItem.name);
 if (suggestion && activeCompletingItem.category === 'Household') {
 setActiveCompletingItem({...activeCompletingItem, category: suggestion});
 setAutoAddInventory(suggestion !== 'Household');
 }
 }
 }, [activeCompletingItem?.name]);

 const activeItems = shoppingList.filter(item => !item.checked);

 const allStoreTabs = React.useMemo(() => {
 const stores = new Set<string>(customStoreTabs);
 activeItems.forEach(item => {
 if (item.storeName && item.storeName !== 'Anywhere') {
 stores.add(item.storeName);
 }
 });
 return Array.from(stores).sort();
 }, [activeItems, customStoreTabs]);

 const activeItemsByStore = activeItems.reduce((acc, item) => {
 const store = item.storeName || 'Anywhere';
 if (!acc[store]) acc[store] = [];
 acc[store].push(item);
 return acc;
 }, {} as Record<string, ShoppingItem[]>);
 
 const handleAddItemToBuy = (e: React.FormEvent) => {
 e.preventDefault();
 if (!newItemName.trim()) return;

 let targetStore = newStoreName.trim();
 if (activeStoreTab !== 'All' && !targetStore) {
 targetStore = activeStoreTab;
 }

 let finalPrice = newItemPrice.trim();

 const newItem: ShoppingItem = {
 id: Math.random().toString(36).substring(7),
 name: newItemName.trim(),
 category: selectedCategory,
 storeName: targetStore,
 amount: newItemAmount.trim(),
 price: finalPrice,
 checked: false
 };

 onAddShoppingItem(newItem);
 setNewItemName('');
 setNewItemAmount('1');
 setNewItemPrice('');
 setNewStoreName('');
 setHasManuallySelectedBuyCategory(false);
 };

 const handleRemoveItem = (id: string) => {
 onDeleteShoppingItem(id);
 };

 const initiateCheck = (item: ShoppingItem) => {
 setActiveCompletingItem(item);
 // Autofill with some logical default or clear
 setStoreName(item.storeName || '');
 setPrice(item.price || '');
 setQuantityBought('1');
 setUnitBought('pcs');
 setIsUnitOpen(false);
 setExpiryDate('');
 setAutoAddInventory(item.category !== 'Household');
 };

 const startDirectPurchase = () => {
 setActiveCompletingItem({ id: 'direct-purchase', name: '', category: 'Household', checked: false });
 setStoreName('');
 setPrice('');
 setQuantityBought('1');
 setUnitBought('pcs');
 setIsUnitOpen(false);
 setExpiryDate('');
 setAutoAddInventory(false);
 };

 const quickCheck = (item: ShoppingItem) => {
 onUpdateShoppingItem(item.id, { 
 checked: true, 
 storeName: item.storeName || 'Unspecified', 
 price: item.price || 'Unspecified', 
 purchaseDate: new Date().toISOString().split('T')[0], 
 quantityBought: item.amount || '1' 
 });

 if (item.category !== 'Household') {
 onAddToInventory({
 name: item.name,
 category: item.category,
 quantity: item.amount || '1',
 location: 'Pantry',
 });
 }
 };

 const submitPurchaseDetails = () => {
 if (!activeCompletingItem) return;
 if (!activeCompletingItem.name.trim()) return;

 const record: PurchaseRecord = {
 id: Math.random().toString(36).substring(7),
 name: activeCompletingItem.name.trim(),
 category: activeCompletingItem.category,
 price: price.trim() ? (price.startsWith('$') ? price.trim() : `$${price.trim()}`) : 'Unspecified',
 storeName: storeName.trim() || 'Unspecified Store',
 purchaseDate: purchaseDate,
 quantityBought: `${quantityBought.trim() || '1'}${unitBought}`
 };

 // 1. Add purchase reference record
 onAddPurchaseRecord(record);

 // 2. Mark shopping item as checked
 if (activeCompletingItem.id !== 'direct-purchase') {
 onUpdateShoppingItem(activeCompletingItem.id, { 
 checked: true, 
 storeName: record.storeName, 
 price: record.price, 
 purchaseDate: record.purchaseDate, 
 quantityBought: record.quantityBought 
 });
 }

 // 3. Option to auto-add to active kitchen inventory
 if (autoAddInventory && activeCompletingItem.category !== 'Household') {
 onAddToInventory({
 name: activeCompletingItem.name,
 category: activeCompletingItem.category,
 quantity: record.quantityBought,
 location: 'Pantry', // default
 expiryDate: expiryDate || undefined, // This triggers the dynamic standard expiry if left empty!
 });
 }

 setActiveCompletingItem(null);
 };

 const filteredHistory = purchaseHistory.filter(record => 
 record.name.toLowerCase().includes(searchHistoryQuery.toLowerCase()) ||
 record.storeName.toLowerCase().includes(searchHistoryQuery.toLowerCase()) ||
 record.category.toLowerCase().includes(searchHistoryQuery.toLowerCase())
 );

 const sortedHistory = React.useMemo(() => {
 return [...filteredHistory].sort((a, b) => {
 const timeA = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0;
 const timeB = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0;
 if (isNaN(timeA) || isNaN(timeB)) {
 return (b.purchaseDate || '').localeCompare(a.purchaseDate || '');
 }
 return timeB - timeA;
 });
 }, [filteredHistory]);

 return (
 <motion.div 
 initial={{ opacity: 0, y: 15 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0 }}
 className="pb-32 px-6 pt-24 max-w-lg mx-auto font-sans"
 >
 <header className="mb-12">
 <h2 className="text-4xl font-light mb-2 text-ink-black">To Buy & References</h2>
 <p className="text-zinc-400 text-sm font-medium">
 Manage your replenishment lists and check past prices & stores.
 </p>
 </header>

 {/* Personal History Reference */}
 <section id="tour-history-benchmarks" className="mb-6 p-3.5 bg-white border border-zinc-200 rounded-[18px] shadow-sm animate-in fade-in">
 <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
 <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1a1a1a] flex items-center gap-2">
 <Crown className="w-4 h-4 text-indigo-500 animate-pulse" />
 Personal Price Matcher
 </h3>
 <button
 type="button"
 onClick={() => setIsPriceHistoryOpen(true)}
 className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 :bg-indigo-950/50 text-indigo-600 text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer border border-indigo-100 "
 >
 Price History 🕒
 </button>
 </div>

 {/* Dynamic Inner Search Bar */}
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
 <Search className="w-4 h-4" />
 </div>
 <input
 type="text"
 placeholder="Search past item prices (e.g. Banana, Milk)..."
 value={priceMatcherSearch}
 onClick={() => setIsPriceHistoryOpen(true)}
 onChange={(e) => {
 setPriceMatcherSearch(e.target.value);
 setIsPriceHistoryOpen(true);
 if (e.target.value.trim().length > 1) {
 setExpandedPriceMatcherItem(e.target.value.trim());
 } else {
 setExpandedPriceMatcherItem(null);
 }
 }}
 className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-[12px] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-ink-black placeholder:text-zinc-450 cursor-pointer"
 />
 </div>
 </section>

 {/* Store Tabs */}
 <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-6 py-2">
 <button
 onClick={() => setActiveStoreTab('All')}
 className={`flex-shrink-0 px-5 py-2.5 rounded-[12px] text-xs font-bold uppercase tracking-widest transition-all border ${
 activeStoreTab === 'All' 
 ? 'bg-ink-black text-white border-ink-black shadow-md' 
 : 'bg-white text-zinc-500 hover:bg-zinc-50 border-zinc-200 hover:shadow-sm'
 }`}
 >
 All Stores
 </button>
 {allStoreTabs.map(store => (
 <button
 key={store}
 onClick={() => setActiveStoreTab(store)}
 className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-xs font-bold uppercase tracking-widest transition-all border ${
 activeStoreTab === store 
 ? 'bg-ink-black text-white border-ink-black shadow-md' 
 : 'bg-white text-zinc-500 hover:bg-zinc-50 border-zinc-200 hover:shadow-sm'
 }`}
 >
 <Store className="w-3.5 h-3.5" />
 {store}
 </button>
 ))}
 {isAddingStoreTab ? (
 <div className="flex-shrink-0 flex items-center bg-white border border-ink-black rounded-[12px] px-2 py-1 shadow-sm">
 <input 
 autoFocus 
 value={newStoreTabName} 
 onChange={e => setNewStoreTabName(e.target.value)} 
 onKeyDown={(e) => {
 if (e.key === 'Enter') {
 e.preventDefault();
 if (newStoreTabName.trim() && !allStoreTabs.includes(newStoreTabName.trim())) {
 setCustomStoreTabs(prev => [...prev, newStoreTabName.trim()]);
 setActiveStoreTab(newStoreTabName.trim());
 }
 setNewStoreTabName('');
 setIsAddingStoreTab(false);
 } else if (e.key === 'Escape') {
 setNewStoreTabName('');
 setIsAddingStoreTab(false);
 }
 }}
 onBlur={() => {
 if (newStoreTabName.trim() && !allStoreTabs.includes(newStoreTabName.trim())) {
 setCustomStoreTabs(prev => [...prev, newStoreTabName.trim()]);
 setActiveStoreTab(newStoreTabName.trim());
 }
 setNewStoreTabName('');
 setIsAddingStoreTab(false);
 }}
 placeholder="Store name..."
 className="bg-transparent border-none focus:outline-none text-xs px-3 py-1.5 w-32 text-ink-black uppercase font-bold tracking-widest"
 />
 </div>
 ) : (
 <button 
 onClick={() => setIsAddingStoreTab(true)}
 className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-xs font-bold uppercase tracking-widest transition-all border bg-white text-zinc-500 border-zinc-200 border-dashed hover:border-zinc-300 hover:bg-zinc-50"
 >
 <Plus className="w-3.5 h-3.5" /> Store
 </button>
 )}
 </div>

 {/* Part 1: Quick Add to Buy Form */}
 <section id="tour-to-buy-form" className="mb-10 p-6 bg-zinc-50 rounded-[20px] border border-zinc-100">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
 <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
 <ShoppingBag className="w-3.5 h-3.5 text-ink-black" />
 Add Item to {activeStoreTab === 'All' ? 'buy' : activeStoreTab}
 </h3>
 <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
 <Crown className="w-3 h-3 text-bamboo-green" /> Lowest historical price tracker
 </div>
 </div>
 
 <form onSubmit={handleAddItemToBuy} className="flex flex-col gap-3">
 <div className="flex flex-col relative w-full bg-white border border-zinc-200 rounded-[12px] focus-within:border-forest-green focus-within:ring-1 focus-within:ring-forest-green overflow-hidden transition-all shadow-sm">
 <div className="flex items-center">
 <input 
 type="text"
 placeholder={`What should we buy${activeStoreTab !== 'All' ? ` at ${activeStoreTab}` : ''}? (e.g., Avocados)`}
 value={newItemName}
 onChange={(e) => setNewItemName(e.target.value)}
 className="flex-1 px-4 py-3 bg-transparent text-sm focus:outline-none placeholder-zinc-400 font-medium text-ink-black h-[46px]"
 />
 <div className="flex items-center h-full mr-1 my-1 bg-zinc-50 rounded-[8px] p-0.5 border border-zinc-100 shrink-0">
 <button 
 type="button" 
 onClick={() => setNewItemAmount(Math.max(1, (parseInt(newItemAmount) || 1) - 1).toString())}
 className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:bg-white hover:shadow-sm rounded-md transition-all font-medium"
 >
 -
 </button>
 <div className="w-6 text-center font-semibold text-sm text-ink-black">
 {newItemAmount || '1'}
 </div>
 <button 
 type="button" 
 onClick={() => setNewItemAmount(((parseInt(newItemAmount) || 1) + 1).toString())}
 className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:bg-white hover:shadow-sm rounded-md transition-all font-medium"
 >
 +
 </button>
 </div>
 </div>
 {priceHistoryText && (
 <span className="text-[11px] text-zinc-500 font-medium px-4 pb-2 flex items-center gap-1.5 border-t border-zinc-100 bg-zinc-50/50 pt-1.5">
 <Crown className="w-3.5 h-3.5 text-forest-green" /> {priceHistoryText}
 </span>
 )}
 </div>
 <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3">
 <input
 type="text"
 placeholder="Est. Price (e.g., $3.99) - Opt"
 value={newItemPrice}
 onChange={(e) => setNewItemPrice(e.target.value)}
 className="flex-1 w-full sm:w-auto px-4 py-3 bg-white border border-zinc-200 rounded-[12px] text-sm focus:outline-none focus:border-forest-green transition-colors font-medium shadow-sm"
 />
 {activeStoreTab === 'All' && (
 <input
 type="text"
 placeholder="Where? (e.g., Costco) - Optional"
 value={newStoreName}
 onChange={(e) => setNewStoreName(e.target.value)}
 className="flex-[1.5] w-full sm:w-auto px-4 py-3 bg-white border border-zinc-200 rounded-[12px] text-sm focus:outline-none focus:border-forest-green transition-colors font-medium shadow-sm"
 />
 )}
 <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
 <select
 value={selectedCategory}
 onChange={(e) => {
 setSelectedCategory(e.target.value);
 setHasManuallySelectedBuyCategory(true);
 }}
 className="flex-[2] sm:flex-none px-3 py-3 bg-white border border-zinc-200 rounded-[12px] text-xs font-semibold focus:outline-none focus:border-forest-green min-w-[120px] shadow-sm text-zinc-700"
 >
 {categories.filter(c => c !== 'All Items').map(c => (
 <option key={c} value={c}>{c}</option>
 ))}
 </select>
 <button
 type="submit"
 className="flex-1 sm:flex-none shrink-0 px-8 py-3 bg-forest-green text-white hover:bg-green-700 rounded-[12px] flex items-center justify-center transition-all shadow-sm active:scale-95 text-xs font-bold gap-2"
 >
 <Plus className="w-4 h-4" /> Add
 </button>
 </div>
 </div>
 </form>
 </section>

 {/* Part 2: Active To-Buy List */}
 <section className="mb-12">
 <div className="flex justify-between items-center mb-4">
 <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Current Items to Buy ({activeItems.length})</h3>
 </div>

 {activeItems.length === 0 ? (
 <div className="p-8 text-center bg-zinc-50/50 rounded-3xl border border-dashed border-zinc-200">
 <p className="text-zinc-500 text-sm font-medium">
 No pending purchases. Everything is fully stocked!
 </p>
 </div>
 ) : (
 <div className="space-y-8">
 {Object.entries(activeItemsByStore)
 .filter(([store]) => activeStoreTab === 'All' || store === activeStoreTab)
 .map(([store, items]) => (
 <div key={store} className="bg-zinc-50/30 rounded-3xl p-5 shadow-sm border border-zinc-100 animate-in fade-in">
 <div className="flex items-center gap-2 mb-5 pl-2">
 <div className="w-8 h-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center shadow-sm text-zinc-500">
 <Store className="w-4 h-4" />
 </div>
 <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-ink-black/70">
 {store} <span className="text-zinc-400 font-medium tracking-normal ml-1 border pl-2 bg-white rounded-md px-1">{items.length}</span>
 </h4>
 </div>
 <div className="grid grid-cols-1 gap-3.5">
 {items.map((item) => (
 <div 
 key={item.id} 
 className="p-4 bg-white border border-zinc-100 rounded-2xl flex flex-col hover:shadow-md hover:border-zinc-200 transition-all group gap-3 shadow-sm"
 >
 {editingItemId === item.id ? (
 <div className="flex-1 w-full space-y-3">
 <div className="flex flex-col sm:flex-row gap-2 w-full">
 <div className="flex-1 flex items-center bg-white border border-zinc-200 rounded-[8px] focus-within:border-forest-green focus-within:ring-1 focus-within:ring-forest-green overflow-hidden transition-colors h-[34px]">
 <input 
 type="text" 
 value={editItemName}
 onChange={(e) => setEditItemName(e.target.value)}
 className="flex-1 px-3 py-2 bg-transparent text-sm focus:outline-none placeholder-zinc-400 font-medium text-ink-black min-w-0"
 placeholder="Item name"
 autoFocus
 />
 <div className="flex items-center h-full my-0.5 mr-0.5 bg-zinc-50 rounded-[6px] p-0.5 border border-zinc-100 shrink-0">
 <button 
 type="button" 
 onClick={() => setEditItemAmount(Math.max(1, (parseInt(editItemAmount) || 1) - 1).toString())}
 className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:bg-white hover:shadow-sm rounded-md transition-all font-medium text-xs w-6"
 >
 -
 </button>
 <div className="text-center font-semibold text-xs text-ink-black w-5 shrink-0">
 {editItemAmount || '1'}
 </div>
 <button 
 type="button" 
 onClick={() => setEditItemAmount(((parseInt(editItemAmount) || 1) + 1).toString())}
 className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:bg-white hover:shadow-sm rounded-md transition-all font-medium text-xs w-6"
 >
 +
 </button>
 </div>
 </div>
 <select
 value={editCategory}
 onChange={(e) => setEditCategory(e.target.value)}
 className="w-[120px] px-3 py-2 bg-white border border-zinc-200 rounded-[8px] text-xs font-semibold focus:outline-none focus:border-forest-green text-zinc-700 h-[34px] shrink-0"
 >
 {categories.filter(c => c !== 'All Items').map(c => (
 <option key={c} value={c}>{c}</option>
 ))}
 </select>
 </div>
 <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
 <input 
 type="text" 
 value={editItemPrice}
 onChange={(e) => setEditItemPrice(e.target.value)}
 className="flex-1 min-w-[70px] px-3 py-2 bg-white border border-zinc-200 rounded-[8px] text-xs focus:outline-none focus:border-forest-green h-[34px]"
 placeholder="Price"
 />
 <input 
 type="text" 
 value={editStoreName}
 onChange={(e) => setEditStoreName(e.target.value)}
 className="flex-[1.5] min-w-[100px] px-3 py-2 bg-white border border-zinc-200 rounded-[8px] text-xs focus:outline-none focus:border-forest-green h-[34px]"
 placeholder="Store (optional)"
 />
 <button onClick={saveEditItem} className="px-3 py-2 bg-forest-green hover:bg-green-700 text-white text-xs font-bold rounded-[8px] whitespace-nowrap shrink-0 transition-colors h-[34px]">
 Save
 </button>
 <button onClick={() => setEditingItemId(null)} className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-bold rounded-[8px] whitespace-nowrap shrink-0 transition-colors h-[34px]">
 Cancel
 </button>
 </div>
 </div>
 ) : (
 <div className="flex items-center justify-between w-full">
 <div className="flex items-center gap-3.5 text-left flex-1" title="Click to edit item">
 <button onClick={(e) => { e.stopPropagation(); quickCheck(item); }} className="shrink-0 p-1" title="Quick check off without logging details">
 <Circle className="w-5 h-5 text-zinc-400 hover:text-bamboo-green transition-colors" />
 </button>
 <div className="flex-1 cursor-text flex items-start justify-between" onClick={() => startEditingItem(item)}>
 <div className="min-w-0 pr-2">
 <span className="font-semibold text-ink-black text-sm block mb-0.5 truncate">{item.name}</span>
 
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 bg-zinc-50 border border-zinc-100 rounded-md px-1.5 py-0.5 w-fit">
 {getCategoryIcon(item.category)}
 {item.category}
 </span>
 {item.price ? (
 <span className="text-[10px] font-bold tracking-wider text-[#2c8c2c] flex items-center gap-1 bg-[#eef5f1] border border-[#f0fdf4] rounded-md px-1.5 py-0.5 w-fit">
 <DollarSign className="w-2.5 h-2.5" />
 {item.price}
 </span>
 ) : getLowestHistoricalPrice(item.name) ? (
 <button
 onClick={(e) => { e.stopPropagation(); setSelectedHistoryItemName(item.name); }}
 className="text-[10px] font-bold tracking-wider text-[#2c8c2c] flex items-center gap-1 bg-[#eef5f1] border border-[#f0fdf4] hover:bg-[#e0eedf] transition-colors rounded-md px-1.5 py-0.5 w-fit cursor-pointer"
 >
 <Crown className="w-2.5 h-2.5" />
 {getLowestHistoricalPrice(item.name)?.price} at {getLowestHistoricalPrice(item.name)?.storeName}
 </button>
 ) : null}
 </div>
 </div>
 {item.amount && (
 <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-50 border border-zinc-100 px-2 py-1 rounded-md shrink-0">
 {item.amount}
 </span>
 )}
 </div>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <button 
 onClick={() => initiateCheck(item)}
 className="p-1 px-3 bg-white text-ink-black hover:bg-zinc-100 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all flex items-center gap-1 border border-zinc-300 shadow-sm"
 >
 Buy <ArrowUpRight className="w-3 h-3 text-zinc-500" />
 </button>
 <button 
 onClick={() => handleRemoveItem(item.id)}
 className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>
 )}
 </section>

 {/* Interactive Complete-Purchase Modal / Slider panel */}
 <AnimatePresence>
 {activeCompletingItem && (
 <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
 <motion.div
 initial={{ y: '100%', opacity: 0 }}
 animate={{ y: 0, opacity: 1 }}
 exit={{ y: '100%', opacity: 0 }}
 className="bg-white w-full max-w-md rounded-t-[28px] sm:rounded-[20px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
 >
 <div className="p-6 border-b border-zinc-100 flex justify-between items-start bg-zinc-50">
 <div className="w-full mr-4">
 <div className="flex items-center gap-2 mb-2">
 <span className="w-2 h-2 rounded-full bg-bamboo-green" />
 <span className="text-xs font-bold uppercase tracking-widest text-ink-black">
 {activeCompletingItem.id === 'direct-purchase' ? 'Log Direct Purchase' : 'Log Purchase'}
 </span>
 </div>
 <input
 type="text"
 value={activeCompletingItem.name}
 onChange={(e) => setActiveCompletingItem({...activeCompletingItem, name: e.target.value})}
 className="w-full text-lg font-bold text-zinc-600 bg-transparent border-b border-transparent hover:border-zinc-200 focus:border-zinc-300 focus:outline-none transition-colors px-0 pb-1"
 placeholder="Product Name"
 />
 </div>
 <button 
 onClick={() => setActiveCompletingItem(null)}
 className="p-1.5 text-zinc-400 hover:text-ink-black transition-colors shrink-0"
 >
 <Plus className="w-5 h-5 rotate-45" />
 </button>
 </div>

 <div className="p-6 space-y-6 overflow-y-auto">
 <div className="grid grid-cols-1 gap-4">
 <div>
 <label className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-400 block mb-2 text-left">
 Category
 </label>
 <select 
 value={activeCompletingItem.category}
 onChange={(e) => {
 const cat = e.target.value;
 setActiveCompletingItem({...activeCompletingItem, category: cat});
 setAutoAddInventory(cat !== 'Household');
 }}
 className="w-full px-3 py-3 bg-zinc-50 border border-zinc-200 rounded-[12px] text-sm focus:outline-none focus:bg-white focus:border-zinc-300"
 >
 {categories.filter(c => c !== 'All Items').map(c => (
 <option key={c} value={c}>{c}</option>
 ))}
 </select>
 </div>
 </div>
 <div>
 <label className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-400 block mb-2 text-left flex items-center gap-1.5">
 <Store className="w-3 h-3 text-zinc-400" /> WHERE (Store Name)
 </label>
 <input 
 type="text" 
 placeholder="Costco, Supermarket, Costco, Local market..."
 value={storeName}
 onChange={(e) => setStoreName(e.target.value)}
 className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-[12px] text-sm focus:outline-none focus:bg-white focus:border-zinc-400 transition-all font-medium text-ink-black"
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-400 block mb-2 flex items-center gap-1.5">
 <DollarSign className="w-3 h-3 text-zinc-400" /> HOW MUCH (Price paid)
 </label>
 <input 
 type="text" 
 placeholder="e.g. $4.99"
 value={price}
 onChange={(e) => setPrice(e.target.value)}
 className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-[12px] text-sm focus:outline-none focus:bg-white focus:border-zinc-400 transition-all font-medium text-ink-black"
 />
 </div>
 <div>
 <label className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-400 block mb-2 flex items-center gap-1.5">
 <Archive className="w-3 h-3 text-zinc-400" /> Quantity
 </label>
 <div className="flex flex-col gap-2">
 <div className="flex bg-zinc-50 border border-zinc-200 rounded-[12px] overflow-visible focus-within:bg-white focus-within:border-zinc-400 transition-all relative">
 <input 
 type="number" 
 value={quantityBought}
 onChange={(e) => setQuantityBought(e.target.value)}
 className="w-full border-0 bg-transparent px-4 py-3 text-sm focus:ring-0 font-medium text-ink-black focus:outline-none" 
 />
 <div 
 className="px-4 flex items-center gap-2 cursor-pointer hover:bg-zinc-100 border-l border-zinc-200 relative"
 onClick={() => setIsUnitOpen(!isUnitOpen)}
 >
 <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 font-sans">{unitBought}</span>
 <ChevronDown className={`w-3 h-3 text-zinc-300 transition-transform ${isUnitOpen ? 'rotate-180' : ''}`} />
 
 <AnimatePresence>
 {isUnitOpen && (
 <motion.div 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: 10 }}
 className="absolute top-full right-0 mt-2 bg-white border border-zinc-100 rounded-xl shadow-xl z-20 py-2 min-w-[100px]"
 >
 {UNITS.map(u => (
 <button 
 key={u}
 type="button"
 onClick={(e) => { e.stopPropagation(); setUnitBought(u); setIsUnitOpen(false); }}
 className="w-full px-4 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-ink-black hover:bg-zinc-50 font-sans"
 >
 {u}
 </button>
 ))}
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </div>
 <input
 type="range"
 min="1"
 max={(unitBought === 'g' || unitBought === 'ml') ? 2000 : 50}
 step={(unitBought === 'g' || unitBought === 'ml') ? 10 : 1}
 value={Number(quantityBought) || 1}
 onChange={(e) => setQuantityBought(e.target.value)}
 className="w-full h-2 mb-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
 />
 </div>
 </div>
 </div>

 <div>
 <label className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-400 block mb-2 flex items-center gap-1.5">
 <Calendar className="w-3 h-3 text-zinc-400" /> WHEN (Purchase Date)
 </label>
 <input 
 type="date" 
 value={purchaseDate}
 onChange={(e) => setPurchaseDate(e.target.value)}
 className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-[12px] text-sm focus:outline-none focus:bg-white focus:border-zinc-400 transition-all font-medium text-ink-black"
 />
 </div>

 <div className="pt-2 border-t border-zinc-100 flex items-center gap-3">
 <input 
 type="checkbox"
 id="auto-add-inv"
 checked={autoAddInventory}
 onChange={(e) => setAutoAddInventory(e.target.checked)}
 className="w-4 h-4 rounded border-zinc-300 text-bamboo-green focus:ring-bamboo-green cursor-pointer"
 />
 <label htmlFor="auto-add-inv" className="text-xs text-zinc-500 font-medium cursor-pointer select-none">
 Add to active food inventory (uncheck for daily necessities)
 </label>
 </div>

 {autoAddInventory && (
 <div className="animate-in fade-in slide-in-from-top-2 duration-350">
 <label className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-400 block mb-2 flex items-center gap-1.5">
 <Calendar className="w-3 h-3 text-zinc-400" /> EXPIRY DATE (Optional)
 </label>
 <input 
 type="date" 
 value={expiryDate}
 onChange={(e) => setExpiryDate(e.target.value)}
 className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-[12px] text-sm focus:outline-none focus:bg-white focus:border-zinc-400 transition-all font-medium text-ink-black"
 />
 <p className="mt-1.5 text-[10px] text-zinc-400">
 If left blank, a typical shelf life of <strong className="text-ink-black font-semibold">{activeCompletingItem ? getNormalShelfLife(activeCompletingItem.name, activeCompletingItem.category) : 7} days</strong> will be used.
 </p>
 </div>
 )}

 <button
 type="button"
 onClick={submitPurchaseDetails}
 className="w-full py-4 bg-ink-black text-white rounded-[14px] text-xs font-bold uppercase tracking-[0.2em] shadow-lg hover:opacity-95 transition-all active:scale-95"
 >
 Log Reference & Complete
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 <AnimatePresence>
 {editingHistoryItem && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <motion.div 
 initial={{ backgroundColor: 'rgba(255,255,255,0)' }}
 animate={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
 exit={{ backgroundColor: 'rgba(255,255,255,0)' }}
 className="absolute inset-0 backdrop-blur-sm"
 onClick={() => setEditingHistoryItem(null)}
 />
 <motion.div 
 initial={{ opacity: 0, y: 30, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 20, scale: 0.95 }}
 className="relative w-full max-w-md bg-white rounded-[24px] shadow-2xl overflow-hidden border border-zinc-100"
 >
 <div className="p-6 space-y-6">
 <header>
 <h3 className="text-[17px] font-light text-ink-black mb-1">Edit Purchase Log</h3>
 <input 
 type="text"
 value={editingHistoryItem.name}
 onChange={(e) => setEditingHistoryItem({...editingHistoryItem, name: e.target.value})}
 className="w-full text-[21px] font-bold leading-[14px] text-zinc-500 uppercase tracking-widest bg-transparent border-b border-transparent hover:border-zinc-200 focus:border-zinc-300 focus:outline-none transition-colors px-0 pb-1"
 placeholder="Product Name"
 />
 </header>
 
 <div className="space-y-4">
 <div>
 <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 block mb-2">Store</label>
 <input 
 type="text" 
 value={editingHistoryItem.storeName}
 onChange={(e) => setEditingHistoryItem({...editingHistoryItem, storeName: e.target.value})}
 className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-[12px] text-sm focus:outline-none focus:bg-white focus:border-zinc-400 transition-all font-medium text-ink-black"
 />
 </div>
 <div>
 <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 block mb-2">Category</label>
 <select
 value={editingHistoryItem.category}
 onChange={(e) => setEditingHistoryItem({...editingHistoryItem, category: e.target.value})}
 className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-[12px] text-sm focus:outline-none focus:bg-white focus:border-zinc-300 transition-all font-medium text-ink-black"
 >
 {categories.filter(c => c !== 'All Items').map(cat => (
 <option key={cat} value={cat}>{cat}</option>
 ))}
 </select>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 block mb-2">Price</label>
 <input 
 type="text" 
 value={editingHistoryItem.price}
 onChange={(e) => setEditingHistoryItem({...editingHistoryItem, price: e.target.value})}
 className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-[12px] text-sm focus:outline-none focus:bg-white focus:border-zinc-400 transition-all font-medium text-ink-black"
 />
 </div>
 <div>
 <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 block mb-2">Quantity</label>
 <input 
 type="text" 
 value={editingHistoryItem.quantityBought}
 onChange={(e) => setEditingHistoryItem({...editingHistoryItem, quantityBought: e.target.value})}
 className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-[12px] text-sm focus:outline-none focus:bg-white focus:border-zinc-400 transition-all font-medium text-ink-black"
 />
 </div>
 </div>
 <div>
 <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 block mb-2">Date</label>
 <input 
 type="date" 
 value={editingHistoryItem.purchaseDate}
 onChange={(e) => setEditingHistoryItem({...editingHistoryItem, purchaseDate: e.target.value})}
 className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-[12px] text-sm focus:outline-none focus:bg-white focus:border-zinc-400 transition-all font-medium text-ink-black"
 />
 </div>
 </div>

 <div className="pt-4 flex gap-4">
 <button
 type="button"
 onClick={() => setEditingHistoryItem(null)}
 className="flex-1 py-4 bg-zinc-50 text-zinc-500 rounded-[14px] text-xs font-bold uppercase tracking-[0.2em] hover:bg-zinc-100 transition-all"
 >
 Cancel
 </button>
 <button
 type="button"
 onClick={() => {
 onUpdatePurchaseRecord?.(editingHistoryItem.id, editingHistoryItem);
 setEditingHistoryItem(null);
 }}
 className="flex-1 py-4 bg-ink-black text-white rounded-[14px] text-xs font-bold uppercase tracking-[0.2em] shadow-lg hover:opacity-95 transition-all"
 >
 Save Changes
 </button>
 </div>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 <AnimatePresence>
 {selectedHistoryItemName && (
 <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="absolute inset-0 bg-black/40 backdrop-blur-sm"
 onClick={() => setSelectedHistoryItemName(null)}
 />
 <motion.div 
 initial={{ scale: 0.95, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 exit={{ scale: 0.95, opacity: 0 }}
 className="relative w-full max-w-lg bg-white rounded-[24px] shadow-2xl border border-zinc-100 overflow-hidden"
 >
 <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
 <div>
 <h3 className="text-lg font-light text-ink-black">{selectedHistoryItemName} <span className="font-semibold text-zinc-400">History</span></h3>
 </div>
 <button 
 onClick={() => setSelectedHistoryItemName(null)}
 className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center hover:bg-zinc-100 transition-colors"
 >
 <Plus className="w-5 h-5 text-zinc-400 rotate-45" />
 </button>
 </div>
 <div className="p-6 max-h-[60vh] overflow-y-auto no-scrollbar bg-zinc-50/50">
 {selectedHistoryData.records.length > 0 ? (
 <div className="space-y-3">
 {selectedHistoryData.records.map((record) => (
 <div 
 key={record.id} 
 className={`p-4 rounded-[16px] border ${record.id === selectedHistoryData.lowestRecordId ? 'bg-green-50/50 border-[#f0fdf4]' : 'bg-white border-zinc-100'} flex justify-between items-center`}
 >
 <div>
 <div className="flex items-center gap-2 mb-1">
 <h4 className="text-sm font-semibold text-ink-black">{record.storeName}</h4>
 {record.id === selectedHistoryData.lowestRecordId && (
 <span className="text-[10px] font-bold tracking-wider text-[#2c8c2c] flex items-center gap-1 bg-[#eef5f1] px-1.5 py-0.5 rounded border border-[#f0fdf4]">
 <Crown className="w-3 h-3" /> BEST PRICE
 </span>
 )}
 </div>
 <div className="flex items-center gap-3 text-xs text-zinc-500 font-medium">
 <div className="flex items-center gap-1">
 <Calendar className="w-3.5 h-3.5" />
 {record.purchaseDate}
 </div>
 </div>
 </div>
 <div className="text-right flex flex-col items-end">
 <div className="text-lg text-[#2c8c2c] font-light">
 {record.price}
 </div>
 {record.quantityBought && record.quantityBought !== '1' && (
 <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">
 / {record.quantityBought}
 </div>
 )}
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-8 text-zinc-500 text-sm">No history found.</div>
 )}
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* Part 3: Historical References Database */}
 <section className="mt-16 border-t border-zinc-100 pt-12">
 <header className="mb-6 flex flex-col gap-4">
 <div>
 <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1">REFERENCE INDEX</h3>
 <h2 className="text-xl font-light text-ink-black flex items-center gap-3">
 Purchase History & Prices
 <button 
 onClick={startDirectPurchase}
 className="w-8 h-8 rounded-full bg-white border border-zinc-200 text-ink-black shadow-sm flex items-center justify-center hover:bg-zinc-50 transition-colors"
 title="Log a purchase directly"
 >
 <Plus className="w-4 h-4" />
 </button>
 </h2>
 </div>
 <div className="relative w-full">
 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
 <input 
 type="text"
 placeholder="Search reference logs..."
 value={searchHistoryQuery}
 onChange={(e) => setSearchHistoryQuery(e.target.value)}
 className="w-full pl-9 pr-4 py-2 bg-washi-gray border border-zinc-100 rounded-xl text-xs focus:outline-none focus:border-zinc-300 transition-colors"
 />
 </div>
 </header>

 {sortedHistory.length === 0 ? (
 <div className="py-12 text-center bg-zinc-50 border border-dashed border-zinc-100 rounded-[16px]">
 <p className="text-[11px] text-zinc-400 font-medium italic">
 {searchHistoryQuery ? 'No matching references found.' : "You haven't purchased anything yet. Log items to build a price index!"}
 </p>
 </div>
 ) : (
 <div className="space-y-3">
 {(showAllHistory ? sortedHistory : sortedHistory.slice(0, 5)).map(record => (
 <div 
 key={record.id} 
 className="bg-white border border-zinc-100 rounded-[16px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:shadow-sm hover:border-zinc-200 transition-all group"
 onClick={() => setEditingHistoryItem(record)}
 >
 <div className="flex-1">
 <div className="flex items-start justify-between sm:justify-start sm:gap-4 mb-2 sm:mb-1">
 <div>
 <h4 className="font-semibold text-ink-black text-sm mb-1">{record.name}</h4>
 <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 w-fit bg-zinc-50 border border-zinc-100 rounded-md px-1.5 py-0.5">
 {getCategoryIcon(record.category)}
 {record.category}
 </span>
 </div>
 <div className="text-right sm:hidden">
 <div className="font-bold text-ink-black text-sm">{record.price}</div>
 <div className="text-[11px] font-medium text-zinc-500 bg-zinc-50 rounded-md px-1 py-0.5 mt-1 border border-zinc-100">Qty: {record.quantityBought}</div>
 </div>
 </div>
 
 <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
 <div className="flex items-center gap-1.5 text-xs text-zinc-600 bg-zinc-50 px-2 py-1.5 rounded-md border border-zinc-200">
 <Store className="w-4 h-4 text-zinc-500" />
 {record.storeName}
 </div>
 <div className="flex items-center gap-1.5 text-xs text-zinc-600 bg-zinc-50 px-2 py-1.5 rounded-md border border-zinc-200">
 <Calendar className="w-4 h-4 text-zinc-500" />
 {record.purchaseDate}
 </div>
 </div>
 </div>

 <div className="hidden sm:flex flex-col items-end gap-1 mb-2 pr-4 border-r border-zinc-200">
 <span className="font-bold text-ink-black text-base">{record.price}</span>
 <span className="text-[11px] uppercase font-bold tracking-wider text-zinc-500">Qty: {record.quantityBought}</span>
 </div>

 <div className="flex justify-end mt-2 sm:mt-0">
 <button 
 type="button" 
 onClick={(e) => {
 e.stopPropagation();
 if(window.confirm('Delete this record?')) {
 onDeletePurchaseRecord?.(record.id);
 }
 }} 
 className="p-2 bg-white border border-zinc-100 text-zinc-400 rounded-full hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-colors"
 title="Delete"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 ))}
 
 {sortedHistory.length > 5 && (
 <div className="flex justify-center mt-6">
 <button
 type="button"
 onClick={() => setShowAllHistory(!showAllHistory)}
 className="px-4 py-2 bg-zinc-50 hover:bg-zinc-105 border border-zinc-200 text-ink-black text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer :bg-zinc-850 "
 >
 {showAllHistory ? (
 <>
 <span>Show Less</span>
 <ChevronUp className="w-4 h-4 text-zinc-500" />
 </>
 ) : (
 <>
 <span>View All ({sortedHistory.length} items)</span>
 <ChevronDown className="w-4 h-4 text-zinc-500" />
 </>
 )}
 </button>
 </div>
 )}
 </div>
 )}
 </section>

 {/* Sleek Price History popup sheet modal */}
 <AnimatePresence>
 {isPriceHistoryOpen && (
 <div className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
 <motion.div
 initial={{ y: '100%', opacity: 0 }}
 animate={{ y: 0, opacity: 1 }}
 exit={{ y: '100%', opacity: 0 }}
 className="bg-white w-full max-w-lg rounded-t-[28px] sm:rounded-[24px] overflow-hidden shadow-2xl flex flex-col h-[85vh] sm:h-[80vh]"
 >
 <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50 ">
 <div className="flex items-center gap-2">
 <Crown className="w-4 h-4 text-indigo-500" />
 <span className="text-sm font-bold uppercase tracking-wider text-ink-black ">
 Price History & Benchmarks
 </span>
 </div>
 <button 
 onClick={() => setIsPriceHistoryOpen(false)}
 className="p-1.5 text-zinc-400 hover:text-ink-black :text-zinc-200 transition-colors shrink-0"
 >
 <Plus className="w-5 h-5 rotate-45" />
 </button>
 </div>

 {/* Modal Search Bar */}
 <div className="px-5 pt-4 pb-2 bg-white border-b border-zinc-50 ">
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
 <Search className="w-4 h-4" />
 </div>
 <input
 type="text"
 placeholder="Search past item prices (e.g. Banana, Milk)..."
 value={priceMatcherSearch}
 onChange={(e) => {
 setPriceMatcherSearch(e.target.value);
 if (e.target.value.trim().length > 1) {
 setExpandedPriceMatcherItem(e.target.value.trim());
 } else {
 setExpandedPriceMatcherItem(null);
 }
 }}
 className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-[12px] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-ink-black placeholder:text-zinc-450"
 />
 </div>
 </div>

 {/* Modal Accordion Content */}
 <div className="p-5 overflow-y-auto space-y-3 flex-1 pb-16 no-scrollbar bg-white ">
 {itemsToDisplay.toBuy.length > 0 ? (
 <div className="space-y-2">
 <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mb-2 pl-1 flex items-center gap-1.5">
 <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
 {priceMatcherSearch.trim() ? 'Search Results' : 'Active To-Buy List Items'}
 </div>
 <div className="grid grid-cols-1 gap-2">
 {itemsToDisplay.toBuy.map((itemName) => {
 const isExpanded = expandedPriceMatcherItem?.toLowerCase() === itemName.toLowerCase();
 const lowestPast = getLowestHistoricalPrice(itemName);
 const isActiveToBuyItem = activeToBuy.some(n => n.toLowerCase() === itemName.toLowerCase());
 
 return (
 <div 
 key={itemName} 
 className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? 'border-indigo-200 shadow-md bg-zinc-50/50 ' : 'border-zinc-150 bg-white '}`}
 >
 <button
 type="button"
 onClick={() => setExpandedPriceMatcherItem(isExpanded ? null : itemName)}
 className="w-full flex items-center justify-between p-3.5 text-left focus:outline-none"
 >
 <div className="flex items-center gap-2.5 min-w-0 mr-2 flex-1">
 <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isExpanded ? 'bg-indigo-50 text-indigo-500' : 'bg-zinc-50 text-zinc-500'}`}>
 {getCategoryIcon(lowestPast?.category || suggestCategory(itemName) || 'Pantry')}
 </div>
 <div className="min-w-0 text-left">
 <h4 className="font-semibold text-xs text-ink-black truncate pr-1">
 {itemName}
 </h4>
 <p className="text-[9px] text-zinc-400 font-medium whitespace-nowrap">
 {isActiveToBuyItem ? 'Active to-buy item' : 'Purchase history item'}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 {lowestPast && (
 <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full shrink-0">
 Best: {formatPrice(lowestPast.price)}{lowestPast.quantityBought ? `/${lowestPast.quantityBought}` : ''}
 </span>
 )}
 <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-indigo-500' : ''}`} />
 </div>
 </button>

 {isExpanded && (
 <div className="p-4 border-t border-zinc-100 bg-zinc-50/15 space-y-3 animate-in slide-in-from-top-1 duration-200">
 {lowestPast ? (
 <div className="p-4 bg-indigo-50/45 rounded-xl border border-indigo-100/30 text-xs text-indigo-950 flex items-start gap-3 shadow-sm">
 <span className="shrink-0 text-lg leading-none">🎖️</span>
 <div className="space-y-1.5 flex-1">
 <p className="font-semibold text-indigo-950 text-xs">
 Your Personal Lowest Past Price
 </p>
 <div className="flex items-baseline gap-2 flex-wrap">
 <span className="text-xl font-black text-indigo-750 ">
 {formatPrice(lowestPast.price)}
 </span>
 {lowestPast.quantityBought && (
 <span className="text-[11px] font-bold text-zinc-550 ">
 per {lowestPast.quantityBought}
 </span>
 )}
 <span className="text-xs text-zinc-405 font-medium font-sans">
 at
 </span>
 <span className="text-xs font-bold text-indigo-850 bg-indigo-100/30 px-2 py-0.5 rounded-lg border border-indigo-150/10">
 {lowestPast.storeName}
 </span>
 </div>
 <div className="text-[10px] text-zinc-500 font-medium pt-1 border-t border-indigo-100/20 flex justify-between items-center bg-transparent">
 <span>Recorded purchase date</span>
 <span className="font-bold">
 {new Date(lowestPast.purchaseDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
 </span>
 </div>
 </div>
 </div>
 ) : (
 <div className="p-3.5 bg-zinc-50 border border-zinc-150 rounded-xl text-xs text-zinc-450 flex items-start gap-2 shadow-sm">
 <span className="shrink-0 text-sm leading-none">💡</span>
 <span>No personal purchase history recorded yet for "{itemName}". Add to list and check off items or log purchases to track your personal benchmarks!</span>
 </div>
 )}
 </div>
 )}
 </div>
 );
 })}
 </div>
 </div>
 ) : (
 <div className="p-8 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 animate-in fade-in">
 <Search className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
 <p className="text-zinc-500 text-xs font-semibold">
 No matching product found for "{priceMatcherSearch}"
 </p>
 <p className="text-zinc-400 text-[10px] mt-1">
 Try searching a different item name like milk, cabbage, eggs, or spinach.
 </p>
 </div>
 )}
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </motion.div>
 );
}
