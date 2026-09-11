const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SOURCE_DIR = '/home/reza/Documents/Pribadi/project/projectb2b/mobile-app/FOTO PRODUK';
const TARGET_DIR = '/home/reza/Documents/Pribadi/project/projectb2b/mobile-app/FOTO_PRODUK_COMPRESSED';

if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

async function processDirectory() {
  const folders = fs.readdirSync(SOURCE_DIR).filter(f => fs.statSync(path.join(SOURCE_DIR, f)).isDirectory());
  
  console.log(`Found ${folders.length} folders to process.`);
  
  for (let i = 0; i < folders.length; i++) {
    const folder = folders[i];
    const sourceFolder = path.join(SOURCE_DIR, folder);
    const targetFolder = path.join(TARGET_DIR, folder);
    
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }
    
    const files = fs.readdirSync(sourceFolder).filter(f => f.match(/\.(jpg|jpeg|png)$/i));
    
    for (const file of files) {
      const sourceFile = path.join(sourceFolder, file);
      const targetFile = path.join(targetFolder, file);
      
      // Skip if already compressed
      if (fs.existsSync(targetFile)) continue;
      
      try {
        // Resize if width > 1200px, compress JPEG to 80 quality
        await sharp(sourceFile)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80, mozjpeg: true })
          .toFile(targetFile);
          
      } catch (e) {
        console.error(`Failed to compress ${file}: ${e.message}`);
        // If it fails, just copy the original file
        fs.copyFileSync(sourceFile, targetFile);
      }
    }
    console.log(`[${i+1}/${folders.length}] Compressed folder: ${folder}`);
  }
  
  console.log('--- Compression Finished! ---');
}

processDirectory().catch(console.error);