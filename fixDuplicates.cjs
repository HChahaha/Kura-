const fs = require('fs');
const oldCode = fs.readFileSync('src/pages/Scanner.tsx', 'utf8');

const returnIdx = oldCode.indexOf('  return (\\n  <motion.div');
let bottomHalf = oldCode.substring(returnIdx);

const handleFileUploadCode = [
"  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {",
"    try {",
"      if (e.target.files && e.target.files[0]) {",
"        const file = e.target.files[0];",
"        await processImageFile(file);",
"      }",
"    } catch (err: any) {",
"      console.warn('File upload error caught in handler:', err.message || err);",
"      const errName = (err.name || '').toLowerCase();",
"      if ((errName === 'notallowederror' || errName === 'permissiondeniederror' || err.message.includes('denied'))) {",
"        setShowPermissionModal(true);",
"      } else {",
"        setScanError(err.message || 'Failed to upload file');",
"      }",
"    }",
"  };"
].join('\\n');

const upperHalf = fs.readFileSync('src/pages/ScannerUpperHalf.tsx', 'utf8');

fs.writeFileSync('src/pages/Scanner.tsx', upperHalf + '\\n' + handleFileUploadCode + '\\n' + bottomHalf);
console.log('Fixed and deduplicated');
