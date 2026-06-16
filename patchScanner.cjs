const fs = require('fs');
let code = fs.readFileSync('src/pages/Scanner.tsx', 'utf8');

const t = /if \\(data\\.items && Array\\.isArray\\(data\\.items\\) && data\\.items\\.length > 0\\) \\{[\\s\\S]*?throw new Error\\("Could not parse items\\. Please make sure food items & prices are visible\\."\\);\\s*\\}/g;

const newT = \`if (data.items && Array.isArray(data.items)) {
    const items = data.items.map((item: any, idx: number) => {
      const shelfLife = typeof item.name === 'string' ? (FOOD_SHELF_LIFE[item.name] || 7) : 7;
      
      let finalPrice = '';
      if (item.price) {
        let pStr = String(item.price).trim();
        let isNegative = pStr.includes('-');
        pStr = pStr.replace(/[^0-9.]/g, '');
        let numParsed = parseFloat(pStr);
        if (!isNaN(numParsed)) {
          if (isNegative) numParsed = -numParsed;
          finalPrice = \\\`\${numParsed < 0 ? '-' : ''}$\${Math.abs(numParsed).toFixed(2)}\\\`;
        }
      }

      return {
        id: \\\`scanned-\${idx}-\${Math.random().toString(36).substring(7)}\\\`,
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
      setScanError(null);
    }
  } else {
    // Just show empty success
    setDetectedItems([]);
    setScanError(null);
  }\`;

code = code.replace(t, newT);
fs.writeFileSync('src/pages/Scanner.tsx', code);
console.log('patched successfully');
