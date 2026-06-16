const fs = require('fs');
let code = fs.readFileSync('src/pages/Scanner.tsx', 'utf8');

const t = \`  if (data.items && Array.isArray(data.items) && data.items.length > 0) {
  const items = data.items.map((item: any, idx: number) => {
  const shelfLife = FOOD_SHELF_LIFE[item.name] || 7;
  return {
  id: \\\`scanned-\\\${idx}-\\\${Math.random().toString(36).substring(7)}\\\`,
  name: item.name || 'Generic Item',
  price: item.price ? \\\`$\\\${parseFloat(item.price).toFixed(2)}\\\` : '$1.99',
  category: item.category || 'Pantry',
  quantity: item.quantity || '1 unit',
  expiryDate: format(addDays(new Date(), shelfLife), 'yyyy-MM-dd'),
  storeName,
  purchaseDate
  };
  });
  setDetectedItems(items);
  setScanError(null);
  } else {
  throw new Error("Could not detect any valid grocery item lines in receipt. Try another photo.");
  }\`;

const newT = \`  if (data.items && Array.isArray(data.items)) {
    const items = data.items.map((item: any, idx: number) => {
      const shelfLife = typeof item.name === 'string' ? (FOOD_SHELF_LIFE[item.name] || 7) : 7;
      let finalPrice = '';
      if (item.price !== undefined && item.price !== null) {
        let pStr = String(item.price).trim();
        let isNegative = pStr.includes('-');
        pStr = pStr.replace(/[^0-9.]/g, '');
        let numParsed = parseFloat(pStr);
        if (!isNaN(numParsed)) {
          if (isNegative) numParsed = -numParsed;
          finalPrice = \\\`\${numParsed < 0 ? '-' : ''}$\\\${Math.abs(numParsed).toFixed(2)}\\\`;
        }
      }
      return {
        id: \\\`scanned-\\\${idx}-\\\${Math.random().toString(36).substring(7)}\\\`,
        name: typeof item.name === 'string' ? item.name : 'Unknown Item',
        price: finalPrice,
        category: typeof item.category === 'string' ? item.category : 'Pantry',
        quantity: typeof item.quantity === 'string' ? item.quantity : '1',
        expiryDate: format(addDays(new Date(), shelfLife), 'yyyy-MM-dd'),
        storeName,
        purchaseDate
      };
    }).filter((i) => i.name !== 'Unknown Item');
    if (items.length > 0) {
      setDetectedItems(items);
      setScanError(null);
    } else {
      setDetectedItems([]);
      setScanError(null);
    }
  } else {
    setDetectedItems([]);
    setScanError(null);
  }\`;

code = code.replace(t, newT);

const t2 = \`  if (data.items && Array.isArray(data.items) && data.items.length > 0) {
  const items = data.items.map((item: any, idx: number) => {
  const shelfLife = FOOD_SHELF_LIFE[item.name] || 7;
  return {
  id: \\\`scanned-\\\${idx}-\\\${Math.random().toString(36).substring(7)}\\\`,
  name: item.name || 'Generic Item',
  price: item.price ? \\\`$\\\${parseFloat(item.price).toFixed(2)}\\\` : '$1.99',
  category: item.category || 'Pantry',
  quantity: item.quantity || '1 unit',
  expiryDate: format(addDays(new Date(), shelfLife), 'yyyy-MM-dd'),
  storeName,
  purchaseDate
  };
  });
  setDetectedItems(items);
  setScanError(null);
  } else {
  throw new Error("Could not parse items. Please make sure food items & prices are visible.");
  }\`;

code = code.replace(t2, newT);

fs.writeFileSync('src/pages/Scanner.tsx', code);
console.log('patched');
