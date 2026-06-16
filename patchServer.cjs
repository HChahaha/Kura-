const fs = require('fs');
let serverCode = fs.readFileSync('server.ts', 'utf8');

serverCode = serverCode.replace(
  'price: { type: Type.NUMBER },',
  'price: { type: Type.STRING, description: "Price paid. Return exactly as string, e.g. \'10.00\', \'3.00-\'." },'
);

const oldStr = 'const parts = [\n      { text: "Parse the receipt line-by-line and extract the store name, purchase date, and array of purchased, physical grocery items found (skip taxes, discounts, non-food items if possible). For each item extract the name, price paid (numeric), and quantity/weight. Return structured JSON." },\n      { inlineData: { data: imageData, mimeType: mimeType } }\n    ];';

const newStr = 'const parts = [\n      { text: "Extract store name, purchase date, and array of purchased grocery items. Do NOT use strict formatting rules—normalize into standard strings. Cleanly handle negative numeral strings (like \'10.00-\' or discounts) and multi-items. For dates, return YYYY-MM-DD. Ignore taxes/fees. Extract only food items. Return structured JSON." },\n      { inlineData: { data: imageData, mimeType: mimeType } }\n    ];';

serverCode = serverCode.replace(oldStr, newStr);

fs.writeFileSync('server.ts', serverCode);
console.log('patched');
