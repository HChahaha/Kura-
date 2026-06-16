const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const t = `  const handleScanItems = async (items: { name: string; quantity: string; category: string; expiryDate: string }[]) => {`;
const newT = `  const handleScanItems = async (items: { name: string; quantity: string; category: string; expiryDate: string, price?: string, storeName?: string, purchaseDate?: string }[]) => {`;
code = code.replace(t, newT);

const endLogic = `      try {
        await setDoc(doc(db, \`users/\${user.uid}/inventory\`, id), itemData);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, \`users/\${user.uid}/inventory\`);
      }
    }
    
    setNotification({ message: \`Added \${items.length} items to inventory\`, visible: true });`;

const newEndLogic = `      try {
        await setDoc(doc(db, \`users/\${user.uid}/inventory\`, id), itemData);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, \`users/\${user.uid}/inventory\`);
      }

      if (item.price || item.storeName) {
        const hId = Math.random().toString(36).substring(7);
        const recordData = {
          name: item.name,
          category: item.category,
          price: (item.price || '').startsWith('$') ? item.price : \`$\${item.price || '0'}\`,
          storeName: item.storeName || 'Receipt Scan',
          purchaseDate: item.purchaseDate || new Date().toISOString().split('T')[0],
          quantityBought: item.quantity || '1',
          source: 'Receipt scan',
          userId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        try {
          await setDoc(doc(db, \`users/\${user.uid}/purchaseHistory\`, hId), recordData);
        } catch(err) {
          console.error(err);
        }
      }
    }
    
    setNotification({ message: \`Added \${items.length} items to inventory & purchase history\`, visible: true });`;

code = code.replace(endLogic, newEndLogic);

fs.writeFileSync('src/App.tsx', code);
console.log('App patched');
