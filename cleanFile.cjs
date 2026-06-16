const fs = require('fs');
let code = fs.readFileSync('src/pages/ShoppingList.tsx', 'utf8');

const regex = /<\/AnimatePresence>\s*<\/motion\.div>\s*\);\s*}\s*, ''\)}<\/span>/d;
const lines = code.split('\n');

let chopIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith('}') && lines[i].length === 1 && lines[i+1] && lines[i+1].includes(", '')}</span>")) {
    chopIndex = i;
    break;
  }
}

if (chopIndex !== -1) {
  lines.length = chopIndex + 1; // keep up to }
  fs.writeFileSync('src/pages/ShoppingList.tsx', lines.join('\n') + '\n');
  console.log('Truncated');
} else {
  console.log('Not found');
}
