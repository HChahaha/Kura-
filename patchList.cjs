const fs = require('fs');
let code = fs.readFileSync('src/pages/ShoppingList.tsx', 'utf8');

const oldListRenderer = `                    <div className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 truncate">
                      {item.category && <span>{item.category}</span>}
                      {item.category && item.amount && <span>&middot;</span>}
                      {item.amount && <span>x{item.amount}</span>}
                      {(item.price || getLowestHistoricalPrice(item.name)) && (
                        <>
                          <span>&middot;</span>
                          <span>~$\{(item.price || getLowestHistoricalPrice(item.name)?.price)?.toString().replace('$', '')}</span>
                        </>
                      )}
                    </div>`;

const newListRenderer = `                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 truncate mt-0.5">
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
                              <span className="font-bold">$\{(lowestPast.price)?.toString().replace('$', '')}</span>
                            </button>
                          );
                        } else if (item.price) {
                          return (
                            <div className="ml-1 px-1.5 py-0.5 bg-zinc-100 text-zinc-500 border border-transparent rounded-full flex items-center">
                              <span className="font-medium">~$\{(item.price).toString().replace('$', '')} est.</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>`;

code = code.replace(oldListRenderer, newListRenderer);
fs.writeFileSync('src/pages/ShoppingList.tsx', code);
console.log('List updated.');
