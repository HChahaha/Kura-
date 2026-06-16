const fs = require('fs');
let code = fs.readFileSync('src/pages/ShoppingList.tsx', 'utf8');

const t = `              </div>
            </motion.div>
)}
</div>
))}`;
// let's just use string replace.
code = code.replace(/<\/motion\.div>\n\s*\)\}\n\s*<\/div>\n\s*\)\)\}/, `</motion.div>\n          </div>\n        )}\n      </div>\n    ))}`);

fs.writeFileSync('src/pages/ShoppingList.tsx', code);
console.log('Fixed');
