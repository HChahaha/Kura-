const fs = require('fs');
let code = fs.readFileSync('src/pages/ShoppingList.tsx', 'utf8');

const target1 = `  const submitPurchaseDetails = () => {
    if (!activeCompletingItem) return;
    if (!activeCompletingItem.name.trim()) return;

    const record: PurchaseRecord = {
      id: Math.random().toString(36).substring(7),
      name: activeCompletingItem.name.trim(),
      category: activeCompletingItem.category,
      price: price.trim() ? (price.startsWith('$') ? price.trim() : \`$\${price.trim()}\`) : 'Unspecified',
      storeName: storeName.trim() || 'Unspecified Store',
      purchaseDate: purchaseDate,
      quantityBought: \`\${quantityBought.trim() || '1'}\${unitBought}\`
    };`;

const target1Replacement = `  const submitPurchaseDetails = () => {
    if (!activeCompletingItem) return;
    if (!activeCompletingItem.name.trim()) return;

    const record: PurchaseRecord = {
      id: Math.random().toString(36).substring(7),
      name: activeCompletingItem.name.trim(),
      category: activeCompletingItem.category,
      price: price.trim() ? (price.startsWith('$') ? price.trim() : \`$\${price.trim()}\`) : 'Unspecified',
      storeName: storeName.trim() || 'Unspecified Store',
      purchaseDate: purchaseDate,
      quantityBought: \`\${quantityBought.trim() || '1'}\${unitBought}\`,
      source: 'Manual entry'
    };`;

code = code.replace(target1, target1Replacement);

const target2 = `  const quickCheck = (item: ShoppingItem) => {
    onUpdateShoppingItem(item.id, { 
      checked: true, 
      storeName: item.storeName || 'Unspecified', 
      price: item.price || 'Unspecified', 
      purchaseDate: new Date().toISOString().split('T')[0], 
      quantityBought: item.amount || '1' 
    });`;

const target2Replacement = `  const quickCheck = (item: ShoppingItem) => {
    onUpdateShoppingItem(item.id, { 
      checked: true, 
      storeName: item.storeName || 'Unspecified', 
      price: item.price || 'Unspecified', 
      purchaseDate: new Date().toISOString().split('T')[0], 
      quantityBought: item.amount || '1' 
    });
    
    // Quick check doesn't save to history natively wait, it only checks off shopping list, or does it?
    // User requested no fake data, quick check doesn't log price history actually.`;

code = code.replace(target2, target2Replacement);

const historyModalStr = `<div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-ink-black">{record.storeName}</h4>
                          {record.id === selectedHistoryData.lowestRecordId && (
                            <span className="text-[10px] font-bold tracking-wider text-[#2c8c2c] flex items-center gap-1 bg-[#eef5f1] px-1.5 py-0.5 rounded border border-[#f0fdf4]">
                              <Crown className="w-3 h-3" /> BEST PRICE
                            </span>
                          )}
                        </div>`;

const historyModalReplacement = `<div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-ink-black">{record.storeName}</h4>
                          {record.id === selectedHistoryData.lowestRecordId && (
                            <span className="text-[10px] font-bold tracking-wider text-[#2c8c2c] flex items-center gap-1 bg-[#eef5f1] px-1.5 py-0.5 rounded border border-[#f0fdf4]">
                              <Crown className="w-3 h-3" /> BEST PRICE
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-zinc-500 mb-2">
                          {(record as any).source === 'Receipt scan' || record.storeName.includes('scan') || (!record.hasOwnProperty('source') && record.purchaseDate) ? (
                            <>
                              <Receipt className="w-3 h-3" /> Receipt scan
                            </>
                          ) : (
                            <>
                              <CheckSquare className="w-3 h-3" /> Manual entry
                            </>
                          )}
                        </div>`;

code = code.replace(historyModalStr, historyModalReplacement);

fs.writeFileSync('src/pages/ShoppingList.tsx', code);
console.log('patched modal');
