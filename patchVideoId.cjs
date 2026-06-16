const fs = require('fs');
let code = fs.readFileSync('src/pages/Scanner.tsx', 'utf8');

const t = \`<video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted
          className="w-full h-full object-cover"
        />\`;

const newT = \`<video 
          id="viewfinder"
          ref={videoRef}
          autoPlay 
          playsInline 
          muted
          className="w-full h-full object-cover"
        />\`;

code = code.replace(t, newT);
fs.writeFileSync('src/pages/Scanner.tsx', code);
console.log('patched video ID');
