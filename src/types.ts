/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface InventoryItem {
 id: string;
 name: string;
 quantity: string;
 category: string;
 location: string;
 expiryDate?: string; // ISO string YYYY-MM-DD
 daysLeft?: number;
 image?: string;
 isExpiringSoon?: boolean;
}

export interface Recipe {
 id: string;
 name: string;
 jpName?: string;
 calories: number;
 protein: string;
 fat: string;
 carbs: string;
 time: string;
 servings: string;
 difficulty?: 'Easy' | 'Medium' | 'Hard';
 tags: string[];
 image: string;
 readyToCook?: boolean;
 matchScore?: number; // percentage 0-100
 isExternal?: boolean; // if fetched from web
 videoUrl?: string; // link to video source
 missingItems?: number;
 missingIngredients?: string[];
 instructions?: string[];
 fullIngredients?: { name: string; quantity: string; inStock?: 'IN STOCK' | 'LOW STOCK' | 'OUT OF STOCK' }[];
}

export interface ShoppingItem {
 id: string;
 name: string;
 category: string;
 checked: boolean;
 price?: string;
 storeName?: string;
 amount?: string;
 purchaseDate?: string;
 quantityBought?: string;
}

export interface PurchaseRecord {
 id: string;
 name: string;
 category: string;
 price: string;
 storeName: string;
 purchaseDate: string;
 quantityBought: string;
 userId?: string;
 createdAt?: any;
 updatedAt?: any;
}

export type View = 'inventory' | 'shopping' | 'recipes' | 'scanner' | 'add-item' | 'edit-item' | 'recipe-detail' | 'add-recipe' | 'edit-recipe' | 'settings' | 'auth';
