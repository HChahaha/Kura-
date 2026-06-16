const fs = require('fs');

let code = fs.readFileSync('src/pages/ShoppingList.tsx', 'utf8');

const targetStart = code.indexOf('<div className="flex items-center justify-between w-full pr-4">');
if (targetStart === -1) {
  console.log("Could not find part 1");
  process.exit(1);
}

const targetEndMatch = '\\n                    </div>\\n                  )}';
let targetEnd = code.indexOf('</div>\n                  )}', targetStart);

if (targetEnd === -1) {
  targetEnd = code.indexOf('</div>\n                )}', targetStart);
}
if (targetEnd === -1) {
  targetEnd = code.indexOf('</div>\n              )}', targetStart);
}
if (targetEnd === -1) {
  targetEnd = code.indexOf('</div>\n            )}', targetStart);
}

if (targetEnd === -1) {
    // Just find the block ending
    const buyButtonStr = 'Buy <ArrowUpRight className="w-3 h-3 text-zinc-500" />';
    const afterBuy = code.indexOf(buyButtonStr, targetStart);
    targetEnd = code.indexOf(')}', code.indexOf('Trash2', afterBuy));
}

if (targetEnd === -1) {
  console.log("Could not find part 2");
  process.exit(1);
}


const newFragment = `<div className="relative overflow-hidden w-full rounded-[12px] group/item">
            {/* Swipe Background (Trash) */}
            <div className="absolute inset-y-0 right-0 w-24 bg-red-50 flex items-center justify-end pr-4 rounded-[12px]">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>

            {/* Draggable surface */}
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0.5, right: 0 }}
              onDragEnd={(e, info) => {
                if (info.offset.x < -60) handleRemoveItem(item.id);
              }}
              className="flex items-center justify-between w-full bg-white relative z-10"
              style={{ touchAction: 'pan-y' }}
            >
              <div className="flex items-center gap-3.5 text-left flex-1 min-w-0 pr-2" title="Click to edit item">
                <button onClick={(e) => { e.stopPropagation(); quickCheck(item); }} className="shrink-0 p-1" title="Quick check off without logging details">
                  <Circle className="w-5 h-5 text-zinc-300 hover:text-bamboo-green transition-colors" />
                </button>
                <div className="flex-1 cursor-text flex items-center justify-between min-w-0" onClick={() => startEditingItem(item)}>
                  <div className="min-w-0 pr-2 flex-1 text-left" style={{ minWidth: 0 }}>
                    <span className="font-bold text-ink-black text-sm block mb-0.5 truncate">{item.name}</span>
                    
                    <div className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 truncate">
                      {item.category && <span>{item.category}</span>}
                      {item.category && item.amount && <span>&middot;</span>}
                      {item.amount && <span>x{item.amount}</span>}
                      {(item.price || getLowestHistoricalPrice(item.name)) && (
                        <>
                          <span>&middot;</span>
                          <span>~$\{(item.price || getLowestHistoricalPrice(item.name)?.price)?.toString().replace('$', '')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center shrink-0 ml-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); initiateCheck(item); }}
                  className="px-3 py-1.5 bg-bamboo-green hover:brightness-110 text-white text-[11px] font-bold rounded-[8px] transition-all flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" /> Buy
                </button>
              </div>
            </motion.div>
          `;

code = code.substring(0, targetStart) + newFragment + code.substring(targetEnd - 6);

fs.writeFileSync('src/pages/ShoppingList.tsx', code);
console.log("Successfully patched active To-Buy list rendering");
