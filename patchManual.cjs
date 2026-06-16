const fs = require('fs');
let code = fs.readFileSync('src/pages/ShoppingList.tsx', 'utf8');

const t = `                              {isReceipt ? <Receipt className="w-3.5 h-3.5" /> : <div className="flex items-center gap-1 border border-zinc-200 rounded px-1.5 py-0.5"><Plus className="w-3 h-3" /> Manual edit</div>}
                              {!isReceipt && <span className="ml-[20px]">Manual entry</span>}
                              {isReceipt && <span>Receipt scan</span>}
                            </div>`;

const newT = `                              {isReceipt ? <Receipt className="w-4 h-4 opacity-70" /> : <CheckSquare className="w-4 h-4 opacity-70" />}
                              <span>{isReceipt ? 'Receipt scan' : 'Manual entry'}</span>
                            </div>`;

code = code.replace(t, newT);
fs.writeFileSync('src/pages/ShoppingList.tsx', code);
console.log('patched Manual Entry style');
