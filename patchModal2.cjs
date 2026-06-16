const fs = require('fs');
let code = fs.readFileSync('src/pages/ShoppingList.tsx', 'utf8');

const tOldModal = /<div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">[\s\S]*?<\/AnimatePresence>/;

const newModal = `<div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-medium text-ink-black mb-1">{selectedHistoryItemName}</h3>
                <p className="text-sm text-zinc-500">
                  {selectedHistoryData.records.length} purchase{selectedHistoryData.records.length !== 1 ? 's' : ''} recorded across {new Set(selectedHistoryData.records.map(r => r.storeName)).size} store{new Set(selectedHistoryData.records.map(r => r.storeName)).size !== 1 ? 's' : ''}
                </p>
              </div>
              <button 
                onClick={() => setSelectedHistoryItemName(null)}
                className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 transition-colors"
              >
                <Plus className="w-5 h-5 text-zinc-600 rotate-45" />
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
              {selectedHistoryData.records.length > 0 ? (
                <>
                  {/* Top Highlight Card */}
                  {(() => {
                     const lowest = selectedHistoryData.records.find(r => r.id === selectedHistoryData.lowestRecordId);
                     const highest = [...selectedHistoryData.records].sort((a,b) => {
                       const getNum = p => { const m = p.match(/\\d+(\\.\\d+)?/); return m ? parseFloat(m[0]) : 0; };
                       return getNum(b.price) - getNum(a.price);
                     })[0];
                     
                     if (!lowest) return null;
                     
                     const getNum = p => { const m = p.match(/\\d+(\\.\\d+)?/); return m ? parseFloat(m[0]) : 0; };
                     const saveAmt = getNum(highest.price) - getNum(lowest.price);
                     const saveText = saveAmt > 0 ? \`Save $\${saveAmt.toFixed(2)} vs highest\` : '';

                     return (
                       <div className="bg-[#f0fdf4] border border-[#d3e8d8] rounded-[16px] p-5 mb-6 shadow-sm">
                         <div className="flex justify-between items-start">
                           <div className="flex gap-4 items-center">
                             <span className="text-3xl leading-none">👑</span>
                             <div>
                               <div className="text-[11px] font-bold text-[#2c8c2c] tracking-wider mb-1">YOUR LOWEST EVER</div>
                               <div className="text-4xl font-medium text-[#115e11] mb-2">\${(lowest.price).replace('$', '')}</div>
                               <div className="text-sm font-medium text-[#2c8c2c]">{lowest.storeName} &middot; {new Date(lowest.purchaseDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</div>
                             </div>
                           </div>
                           {saveText && (
                             <div className="px-3 py-1 bg-[#d8eedf] text-[#115e11] text-xs font-bold rounded-full">
                               {saveText}
                             </div>
                           )}
                         </div>
                       </div>
                     );
                  })()}

                  <div className="text-[11px] font-bold text-zinc-400 tracking-wider mb-4">FULL PURCHASE HISTORY</div>
                  
                  <div className="relative border-l-2 border-zinc-100 ml-3 pl-6 space-y-4">
                    {selectedHistoryData.records.map((record) => {
                      const isLowest = record.id === selectedHistoryData.lowestRecordId;
                      const isReceipt = (record as any).source === 'Receipt scan' || record.storeName.toLowerCase().includes('scan') || (!record.hasOwnProperty('source') && record.purchaseDate);

                      return (
                        <div key={record.id} className="relative">
                          {/* Timeline dot */}
                          <div className={\`absolute -left-[31px] top-4 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm \${isLowest ? 'bg-[#2c8c2c]' : 'bg-transparent border-[3px] border-zinc-200'}\`} style={!isLowest ? {width: '12px', height: '12px', left: '-29px'} : {}} />

                          <div className={\`p-4 rounded-[16px] border \${isLowest ? 'bg-[#f0fdf4] border-[#d3e8d8]' : 'bg-[#fafafa] border-zinc-150'} flex justify-between items-center\`}>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-base font-medium text-ink-black">{record.storeName}</h4>
                              </div>
                              <div className="flex items-center gap-1.5 text-[13px] text-zinc-500 font-medium">
                                {isReceipt ? <Receipt className="w-4 h-4" /> : <CheckSquare className="w-4 h-4 opacity-70" />}
                                <span>{isReceipt ? 'Receipt scan' : 'Manual entry'}</span>
                              </div>
                              {isLowest && (
                                <div className="mt-2 text-[11px] font-bold text-[#2c8c2c] bg-[#eef5f1] inline-block px-2 py-0.5 rounded-full">
                                  Lowest price
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-medium text-ink-black mb-1">
                                \${record.price.replace('$', '')}
                              </div>
                              <div className="text-sm font-medium text-zinc-500">
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
                <div className="text-center py-12 text-zinc-400">No history available</div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>`;

code = code.replace(tOldModal, newModal);
fs.writeFileSync('src/pages/ShoppingList.tsx', code);
console.log('patched modal!');
