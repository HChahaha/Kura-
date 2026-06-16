const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');
code = code.replace(
`export interface PurchaseRecord {
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
}`,
`export interface PurchaseRecord {
  id: string;
  name: string;
  category: string;
  price: string;
  storeName: string;
  purchaseDate: string;
  quantityBought: string;
  source?: 'Receipt scan' | 'Manual entry';
  userId?: string;
  createdAt?: any;
  updatedAt?: any;
}`
);
fs.writeFileSync('src/types.ts', code);
