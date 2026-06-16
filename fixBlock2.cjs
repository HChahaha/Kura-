const fs = require('fs');
const lines = fs.readFileSync('src/pages/ShoppingList.tsx', 'utf8').split('\n');
const start = 1170;
const end = 1218;

const fixedBlock = `            <motion.div
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
                    
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 truncate mt-0.5 h-5">
                      {item.category && <span>{item.category}</span>}
                      {item.category && item.amount && <span>&middot;</span>}
                      {item.amount && <span>x{item.amount}</span>}
                      
                      {(() => {
                        const lowestPast = getLowestHistoricalPrice(item.name);
                        if (lowestPast) {
                          return (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedHistoryItemName(item.name);
                              }}
                              className="ml-1 px-1.5 py-0.5 bg-[#eef5f1] text-[#2c8c2c] border border-[#d3e8d8] rounded-full flex items-center gap-1 hover:bg-[#d8eedf] transition-colors"
                            >
                              <span>👑</span>
                              <span className="font-bold">\${(lowestPast.price)?.toString().replace('$', '')}</span>
                            </button>
                          );
                        } else if (item.price) {
                          return (
                            <div className="ml-1 px-1.5 py-[1px] bg-zinc-100 text-zinc-500 border border-transparent rounded-full flex items-center">
                              <span className="font-medium">~\${(item.price).toString().replace('$', '')} est.</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
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
            </motion.div>`;

lines.splice(start, end - start + 1, fixedBlock);
fs.writeFileSync('src/pages/ShoppingList.tsx', lines.join('\n'));
console.log('Fixed syntax');
