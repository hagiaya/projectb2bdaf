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

      // Fix isHabis logic
      if (content.includes("stock === 0 || ") && content.includes("status === 'LOW_STOCK'")) {
        content = content.replace(/(\w+)\.stock === 0 \|\| \1\.status === 'LOW_STOCK'/g, "$1.stock === 0 || $1.status === 'OUT_OF_STOCK'");
        changed = true;
      }

      // Change HABIS text to SOLD OUT
      if (content.includes('>HABIS<')) {
        content = content.replace(/>HABIS</g, ">SOLD OUT<");
        changed = true;
      }
      
      // Also change 'Habis' in button text
      if (content.includes("? 'Habis' :")) {
         content = content.replace(/\? 'Habis' :/g, "? 'Sold Out' :");
         changed = true;
      }

      // In product list, fix `Stok Habis` to `Sold Out`
      if (content.includes("? 'Stok Habis' :")) {
         content = content.replace(/\? 'Stok Habis' :/g, "? 'Sold Out' :");
         changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log('Fixed', fullPath);
      }
    }
  }
}

processDir(path.join(__dirname, 'mobile-app/src'));
