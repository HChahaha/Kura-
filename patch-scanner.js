const fs = require('fs');
let code = fs.readFileSync('src/pages/Scanner.tsx', 'utf8');

// Replacement 1: Simplify the Backdrop layer
const startIndex = code.indexOf('  {/* Live Camera Backdrop */}');
if (startIndex !== -1) {
  const endIndex = code.indexOf('  {/* Dark overlay for readability of UI elements */}', startIndex);
  if (endIndex !== -1) {
    const endBlockIndex = code.indexOf('</div>', endIndex) + 6;
    const oldBackdropBlock = code.slice(startIndex, endBlockIndex);
    
    // We add the hidden input at the very top of the returned tree (above backdrop block)
    const newBackdropBlock = `  {/* Always-mounted hidden input for receipt camera or manual uploads with direct capture on mobile */}
  <input 
    type="file" 
    ref={fileInputRef} 
    onChange={handleFileUpload} 
    className="hidden" 
    accept="image/*"
    capture="environment"
  />

  {/* Live Camera Backdrop */}
  <div className="absolute inset-0 z-0 bg-zinc-950">
    {isReady && (
      <video 
        ref={videoRef}
        autoPlay 
        playsInline 
        muted
        className="w-full h-full object-cover opacity-80"
      />
    )}
    {/* Dark overlay for readability of UI elements */}
    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/60 via-transparent to-black/60" />
  </div>`;
    
    code = code.replace(oldBackdropBlock, newBackdropBlock);
    console.log('Successfully replaced Backdrop block!');
  } else {
    console.log('Failed to find Dark overlay string');
  }
} else {
  console.log('Failed to find Live Camera Backdrop string');
}

// Replacement 2: Insert fallback placeholder inside UI controls layer (foreground)
const targetPillIndex = code.indexOf('REMAINING SCANS: {remainingScans} TODAY');
if (targetPillIndex !== -1) {
  const fallbackJSX = `  {/* Center Element placeholder if camera is not active and no items yet */}
  {!isReady && detectedItems.length === 0 && (
    <div className="flex-1 flex flex-col items-center justify-center py-8">
      <div className="space-y-6 max-w-sm text-center w-full">
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-400">
          <Camera className="w-6 h-6 animate-pulse" />
        </div>
        <div className="space-y-2">
          <p className="text-white text-sm font-semibold">
            {error ? 'Camera Access Restricted' : 'Initializing camera stream...'}
          </p>
          {error && (
            <p className="text-zinc-400 text-xs leading-relaxed max-w-xs mx-auto">
              Browser security restricts camera frames inside previews. To use live video scanning, open Kura in a new tab, or choose to upload a receipt photo below.
            </p>
          )}
        </div>
        <button 
          onClick={() => {
            try {
              fileInputRef.current?.click();
            } catch (err: any) {
              console.error("Camera fallback upload click failed:", err);
              setShowPermissionModal(true);
            }
          }}
          disabled={remainingScans <= 0 || isScanning}
          className="mx-auto flex items-center justify-center gap-2 bg-white text-zinc-950 hover:bg-zinc-100 px-6 py-4 rounded-2xl transition-all text-sm uppercase tracking-wider font-extrabold disabled:opacity-40 cursor-pointer w-full shadow-lg"
        >
          <Upload className="w-4 h-4" />
          {remainingScans <= 0 ? 'Daily Limit Reached (2/2)' : 'UPLOAD RECEIPT'}
        </button>
        <p className="text-zinc-500 text-[9px] uppercase font-bold tracking-widest block pt-2">
          Remaining Scans: {remainingScans}/2 Today
        </p>
      </div>
    </div>
  )}`;

  // Find the closing div of the remaining counts pill container
  const pillBlockEnd = code.indexOf('</div>', targetPillIndex) + 6;
  const beforeSlice = code.substring(0, pillBlockEnd);
  const afterSlice = code.substring(pillBlockEnd);
  
  code = beforeSlice + '\n\n' + fallbackJSX + '\n\n' + afterSlice;
  console.log('Successfully inserted UI Controls Layer fallback block!');
} else {
  console.log('Failed to find remaining scans pill start string');
}

fs.writeFileSync('src/pages/Scanner.tsx', code);
console.log('Patch complete.');
