const fs = require('fs');
let code = fs.readFileSync('src/pages/Scanner.tsx', 'utf8');

// replace <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center bg-black/40">
code = code.replace(
  '<div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center bg-black/40">',
  '<div className="absolute inset-0 z-[25] pointer-events-none flex items-center justify-center">' // removed bg-black/40, increased z-index from 10 to 25 so it sits over the rest
);

// fix video
code = code.replace(
  '<video \\n          ref={videoRef}\\n          autoPlay \\n          playsInline \\n          muted\\n          className="w-full h-full object-cover"\\n        />',
  '<video id="viewfinder" ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />'
);

// We should also replace the background in OCR overlay, let's just make sure it parses properly.
fs.writeFileSync('src/pages/Scanner.tsx', code);
console.log('removed dark overlay');
