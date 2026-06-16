const fs = require('fs');
let code = fs.readFileSync('src/pages/Scanner.tsx', 'utf8');

const regex1 = /if \\(data\\.items && Array\\.isArray\\(data\\.items\\) && data\\.items\\.length > 0\\) \\{[\\s\\S]*?throw new Error\\("Could not detect any valid grocery item lines in receipt\\. Try another photo\\."\\);\\s*\\}/;

const regex2 = /if \\(data\\.items && Array\\.isArray\\(data\\.items\\) && data\\.items\\.length > 0\\) \\{[\\s\\S]*?throw new Error\\("Could not parse items\\. Please make sure food items & prices are visible\\."\\);\\s*\\}/;

const newT = [
  "if (data.items && Array.isArray(data.items)) {",
  "  const items = data.items.map((item: any, idx: number) => {",
  "    const shelfLife = typeof item.name === 'string' ? (FOOD_SHELF_LIFE[item.name] || 7) : 7;",
  "    let finalPrice = '';",
  "    if (item.price !== undefined && item.price !== null) {",
  "      let pStr = String(item.price).trim();",
  "      let isNegative = pStr.includes('-');",
  "      pStr = pStr.replace(/[^0-9.]/g, '');",
  "      let numParsed = parseFloat(pStr);",
  "      if (!isNaN(numParsed)) {",
  "        if (isNegative) numParsed = -numParsed;",
  "        finalPrice = (numParsed < 0 ? '-' : '') + '$' + Math.abs(numParsed).toFixed(2);",
  "      }",
  "    }",
  "    return {",
  "      id: 'scanned-' + idx + '-' + Math.random().toString(36).substring(7),",
  "      name: typeof item.name === 'string' ? item.name : 'Unknown Item',",
  "      price: finalPrice,",
  "      category: typeof item.category === 'string' ? item.category : 'Pantry',",
  "      quantity: typeof item.quantity === 'string' ? item.quantity : '1',",
  "      expiryDate: format(addDays(new Date(), shelfLife), 'yyyy-MM-dd'),",
  "      storeName,",
  "      purchaseDate",
  "    };",
  "  }).filter((i) => i.name !== 'Unknown Item');",
  "  if (items.length > 0) {",
  "    setDetectedItems(items);",
  "    setScanError(null);",
  "  } else {",
  "    setDetectedItems([]);",
  "    setScanError(null);",
  "  }",
  "} else {",
  "  setDetectedItems([]);",
  "  setScanError(null);",
  "}"
].join('\\n');

code = code.replace(regex1, newT);
code = code.replace(regex2, newT);

fs.writeFileSync('src/pages/Scanner.tsx', code);
console.log('patched successfully with regex');
