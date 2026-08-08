const sharp = require('sharp');
const fs = require('fs');

async function resizeIcon(inputFile, targetSize) {
  try {
    if (!fs.existsSync(inputFile)) {
      console.log(`File not found: ${inputFile}`);
      return;
    }
    
    // Scale image down to 50%
    const scaledSize = Math.floor(targetSize * 0.5);
    const scaledBuffer = await sharp(inputFile)
      .resize(scaledSize, scaledSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();
      
    // Put it on a transparent canvas
    await sharp({
      create: {
        width: targetSize,
        height: targetSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([
      { input: scaledBuffer, gravity: 'center' }
    ])
    .png()
    .toFile(inputFile + '.new.png');
    
    // Overwrite
    fs.renameSync(inputFile + '.new.png', inputFile);
    console.log(`Successfully padded ${inputFile}`);
  } catch (err) {
    console.error(`Error processing ${inputFile}:`, err);
  }
}

async function main() {
  await resizeIcon('./public/icon-512.png', 512);
  await resizeIcon('./public/icon-192.png', 192);
  await resizeIcon('./assets/icon.png', 1024);
  console.log('All icons processed!');
}

main();
