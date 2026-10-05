const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Fix the invalid JSX inside ternary
      const regex = /:\s*\(\s*(<Text style=\{styles\.productPrice[^>]*>.*?<\/Text>)\s*(\{isLowStock && <Text.*?Stok Menipis<\/Text>\})\s*\)/g;
      
      if (regex.test(content)) {
        content = content.replace(regex, ": (\n                    <>\n                      $1\n                      $2\n                    </>\n                  )");
        changed = true;
      }
      
      const regex2 = /:\s*\(\s*(<Text style=\{\[styles\.productPrice[^>]*>.*?<\/Text>)\s*(\{isLowStock && <Text.*?Stok Menipis<\/Text>\})\s*\)/g;
      if (regex2.test(content)) {
        content = content.replace(regex2, ": (\n                    <>\n                      $1\n                      $2\n                    </>\n                  )");
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log('Fixed syntax in', fullPath);
      }
    }
  }
}

processDir(path.join(__dirname, 'mobile-app/src/app/(dealer)'));
