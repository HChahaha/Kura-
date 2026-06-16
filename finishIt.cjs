const fs = require('fs');
const codeUpper = fs.readFileSync('src/pages/ScannerUpperHalf.tsx', 'utf8');
const oldCode = fs.readFileSync('src/pages/Scanner.tsx', 'utf8');

const returnIdx = oldCode.lastIndexOf('return (');

if (returnIdx !== -1) {
  const codeBottom = oldCode.substring(returnIdx);
  const missingMiddle = [
"  const handleFinish = () => {",
"    onItemsAdded(detectedItems.map(item => ({",
"      name: item.name,",
"      quantity: item.quantity,",
"      category: item.category,",
"      expiryDate: item.expiryDate,",
"      price: item.price,",
"      storeName: item.storeName,",
"      purchaseDate: item.purchaseDate",
"    })));",
"  };",
"",
"  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {",
"    try {",
"      if (e.target.files && e.target.files[0]) {",
"        const file = e.target.files[0];",
"        await processImageFile(file);",
"      }",
"    } catch (err: any) {",
"      console.warn('File upload error caught in handler:', err.message || err);",
"      const errName = (err.name || '').toLowerCase();",
"      if ((errName === 'notallowederror' || errName === 'permissiondeniederror' || err.message.includes('denied'))) {",
"        setShowPermissionModal(true);",
"      } else {",
"        setScanError(err.message || 'Failed to upload file');",
"      }",
"    }",
"  };"
  ].join('\\n');

  fs.writeFileSync('src/pages/Scanner.tsx', codeUpper + '\\n' + missingMiddle + '\\n  ' + codeBottom);
  console.log('Done!');
} else {
  console.log('could not find return');
}
