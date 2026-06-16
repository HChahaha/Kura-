const fs = require('fs');

const oldCode = fs.readFileSync('src/pages/Scanner.tsx', 'utf8');
const handleFinishIdx = oldCode.indexOf('const handleFinish = () => {');
if (handleFinishIdx !== -1) {
  const bottomHalf = oldCode.substring(handleFinishIdx);
  const upperHalf = fs.readFileSync('src/pages/ScannerUpperHalf.tsx', 'utf8');
  fs.writeFileSync('src/pages/Scanner.tsx', upperHalf + '\\n  ' + bottomHalf);
  console.log('Successfully recovered and patched');
} else {
  console.log('oh no');
}
