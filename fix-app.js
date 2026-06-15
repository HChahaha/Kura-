const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/useEffect\(\(\) => \{\n\s*const savedTheme = localStorage\.getItem\('theme'\);\n\s*if \(savedTheme !== 'light'\) \{\n\s*document\.documentElement\.classList\.add\('dark'\);\n\s*localStorage\.setItem\('theme', 'dark'\);\n\s*\}\n\s*\}, \[\]\);\n/, '');
fs.writeFileSync('src/App.tsx', code);
