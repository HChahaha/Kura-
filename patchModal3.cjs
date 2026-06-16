const fs = require('fs');
let code = fs.readFileSync('src/pages/ShoppingList.tsx', 'utf8');

const tOldModal = /<div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">[\s\S]*?(?=<\/motion\.div>\n\s*<\/div>\n\s*\)\}\n\s*<\/AnimatePresence>\n\n\s*\{\/\*\s*Part 3: Historical References Database)/;

const newModal = `<div className="px-6 py-5 flex items-start justify-between">
            <div>
              <h3 className="text-xl font-medium text-ink-black mb-1">{selectedHistoryItemName}</h3>
              <p className="text-[13px] text-zinc-500 font-medium">
                {selectedHistoryData.records.length} purchase{selectedHistoryData.records.length !== 1 ? 's' : ''} recorded across {new Set(selectedHistoryData.records.map(r => r.storeName)).size} store{new Set(selectedHistoryData.records.map(r => r.storeName)).size !== 1 ? 's' : ''}
              </p>
            </div>
            <button 
              onClick={() => setSelectedHistoryItemName(null)}
              className="w-10 h-10 rounded-[12px] border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 transition-colors"
            >
              <Plus className="w-5 h-5 text-zinc-600 rotate-45" />
            </button>
          </div>
          <div className="px-6 pb-6 max-h-[70vh] overflow-y-auto no-scrollbar">
            {selectedHistoryData.records.length > 0 ? (
              <>
                {(() => {
                   const lowest = selectedHistoryData.records.find(r => r.id === selectedHistoryData.lowestRecordId);
                   const highest = [...selectedHistoryData.records].sort((a,b) => {
                     const getNum = (p) => { const m = p.match(/\\d+(\\.\\d+)?/); return m ? parseFloat(m[0]) : 0; };
                     return getNum(b.price) - getNum(a.price);
                   })[0];
                   
                   if (!lowest) return null;
                   
                   const getNum = (p) => { const m = p.match(/\\d+(\\.\\d+)?/); return m ? parseFloat(m[0]) : 0; };
                   const saveAmt = getNum(highest.price) - getNum(lowest.price);
                   const saveText = saveAmt > 0 ? \`Save $\${saveAmt.toFixed(2)} vs highest\` : '';

                   return (
                     <div className="bg-[#f0fdf4] border border-[#d3e8d8] rounded-[16px] p-5 mb-6 shadow-sm">
                       <div className="flex justify-between items-start mb-2">
                         <div className="text-[11px] font-bold text-[#2c8c2c] tracking-wider uppercase">YOUR LOWEST EVER</div>
                         {saveText && (
                           <div className="px-2.5 py-0.5 bg-[#d8eedf] text-[#2c8c2c] text-[10px] font-bold rounded-full">
                             {saveText}
                           </div>
                         )}
                       </div>
                       <div className="flex items-center gap-3">
                         <span className="text-3xl leading-none">👑</span>
                         <div>
                           <div className="text-3xl font-semibold text-[#115e11] leading-none mb-1">
                             \${(lowest.price).replace('$', '')}
                           </div>
                           <div className="text-[13px] font-medium text-[#2c8c2c]">
                             {lowest.storeName} &middot; {new Date(lowest.purchaseDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}
                           </div>
                         </div>
                       </div>
                     </div>
                   );
                })()}

                <div className="text-[10px] font-bold text-zinc-400 tracking-wider mb-5 uppercase px-2">FULL PURCHASE HISTORY</div>
                
                <div className="relative border-l border-zinc-200 ml-[11px] pl-6 pb-2 space-y-4">
                  {selectedHistoryData.records.map((record) => {
                    const isLowest = record.id === selectedHistoryData.lowestRecordId;
                    const isReceipt = (record as any).source === 'Receipt scan' || record.storeName.toLowerCase().includes('scan') || (!record.hasOwnProperty('source') && record.purchaseDate);

                    return (
                      <div key={record.id} className="relative">
                        <div className={\`absolute -left-[30.5px] top-4 w-[13px] h-[13px] rounded-full border-2 border-white shadow-sm \${isLowest ? 'bg-[#2c8c2c]' : 'bg-transparent border-[2px] !border-zinc-300'}\`} />

                        <div className={\`p-4 rounded-[16px] border \${isLowest ? 'bg-[#f5fbf7] border-[#d3e8d8]' : 'bg-[#fafafa] border-zinc-150'} flex justify-between items-center transition-colors\`}>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-[15px] font-medium text-ink-black">{record.storeName}</h4>
                            </div>
                            <div className="flex items-center gap-1.5 text-[12px] text-zinc-500 font-medium whitespace-nowrap">
                              {isReceipt ? <Receipt className="w-3.5 h-3.5" /> : <div className="flex items-center gap-1 border border-zinc-200 rounded px-1.5 py-0.5"><Plus className="w-3 h-3" /> Manual edit</div>}
                              {!isReceipt && <span>Manual entry</span>}
                              {isReceipt && <span>Receipt scan</span>}
                            </div>
                            {isLowest && (
                              <div className="mt-2 text-[10px] font-bold text-[#2c8c2c] bg-[#eef5f1] inline-flex px-2 py-0.5 rounded border border-[#d3e8d8]">
                                Lowest price
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-medium text-ink-black mb-1">
                              \${record.price.replace('$', '')}
                            </div>
                            <div className="text-[12px] font-medium text-zinc-500">
                              {new Date(record.purchaseDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-zinc-400 font-medium">No history available</div>
            )}
          </div>`;

code = code.replace(tOldModal, newModal);
fs.writeFileSync('src/pages/ShoppingList.tsx', code);
console.log('modal updated');
