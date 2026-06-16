const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');
code = code.replace('<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=3" />', '<link rel="apple-touch-icon" href="/apple-touch-icon.png" />');
code = code.replace('<link rel="icon" type="image/svg+xml" href="/favicon.svg?v=3" />', '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />');
code = code.replace('<link rel="manifest" href="/site.webmanifest?v=3" />', '<link rel="manifest" href="/site.webmanifest" />');
fs.writeFileSync('index.html', code);
console.log('patched index');
