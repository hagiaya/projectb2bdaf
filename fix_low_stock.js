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

      // Add isLowStock declaration
      if (content.includes("const isHabis = ") && !content.includes("const isLowStock = ")) {
        content = content.replace(/(const isHabis = (\w+)\.stock === 0 \|\| \2\.status === 'OUT_OF_STOCK';)/g, "$1\n              const isLowStock = !isHabis && (($2.stock > 0 && $2.stock <= 10) || $2.status === 'LOW_STOCK');");
        changed = true;
      }

      // Add Stok Menipis text below price
      // In home.tsx it's styles.productPrice
      // In category/[id].tsx it's styles.productPrice
      // Let's replace the <Text style={styles.productPrice}> line to include the badge
      if (changed) {
        content = content.replace(/(<Text style={styles\.productPrice.*?>.*?<\/Text>)/g, "$1\n                {isLowStock && <Text style={{fontSize: 10, color: '#ef4444', marginTop: 2, fontWeight: 'bold'}}>Stok Menipis</Text>}");
      }
      
      // Flash sale uses <Text style={[styles.productPrice...
      if (changed && content.includes('flash_sale_price')) {
         content = content.replace(/(<Text style={\[styles\.productPrice.*?<\/Text>)/g, "$1\n                    {isLowStock && <Text style={{fontSize: 10, color: '#ef4444', marginTop: 2, fontWeight: 'bold'}}>Stok Menipis</Text>}");
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log('Fixed', fullPath);
      }
    }
  }
}

processDir(path.join(__dirname, 'mobile-app/src/app/(dealer)'));
