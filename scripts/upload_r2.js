const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const mime = require('mime-types');

// Configuration
const R2_ACCOUNT_ID = 'ac6dc537a597c14bf179f608558e1379';
const ACCESS_KEY_ID = '5b356585d16a95f4912dd27768b96de0';
const SECRET_ACCESS_KEY = '12e0d85296d1e7e2ae274776d14149dd573e1cab29e53cb7a1a4777defb487d3';
const BUCKET_NAME = 'b2b-produk-images';
const PUBLIC_R2_URL = 'https://pub-82328a1673e14b96af9b77f7151da127.r2.dev';

const SUPABASE_URL = 'https://mvpwgzkvmadtsspewxtu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_q8MhULti42S-YqSHyA0aNw_Mrh-_jyj';
const FOTO_DIR = '/home/reza/Documents/Pribadi/project/projectb2b/mobile-app/FOTO_PRODUK_COMPRESSED';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
  maxAttempts: 3,
});

async function fileExistsInR2(key) {
  try {
    await s3Client.send(
      new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key }),
      { abortSignal: AbortSignal.timeout(10000) }
    );
    return true;
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) return false;
    return false;
  }
}

async function uploadFileToR2(filePath, r2Key, retries = 3) {
  if (await fileExistsInR2(r2Key)) {
    return `${PUBLIC_R2_URL}/${r2Key}`;
  }

  const fileBuffer = fs.readFileSync(filePath);
  const contentType = mime.lookup(filePath) || 'application/octet-stream';

  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: r2Key,
    Body: fileBuffer,
    ContentType: contentType,
  };

  try {
    await s3Client.send(
      new PutObjectCommand(uploadParams),
      { abortSignal: AbortSignal.timeout(20000) }
    );
    console.log(`  -> Uploaded: ${r2Key}`);
    return `${PUBLIC_R2_URL}/${r2Key}`;
  } catch (err) {
    console.error(`  -> Failed to upload ${r2Key}, retries left ${retries}:`, err.message);
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1500));
      return uploadFileToR2(filePath, r2Key, retries - 1);
    }
    throw err;
  }
}

let cachedToken = null;
let tokenExpiresAt = 0;

async function getSupabaseToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
    body: JSON.stringify({ email: 'ditoapp@atomicmail.io', password: 'admin123' })
  });
  if (!authRes.ok) throw new Error('Supabase Auth failed: ' + (await authRes.text()));
  const data = await authRes.json();
  cachedToken = data.access_token;
  tokenExpiresAt = now + 45 * 60 * 1000;
  return cachedToken;
}

async function run() {
  console.log('=== Starting Cloudflare R2 Buffer Uploader & Sync ===');
  console.log(`Source compressed directory: ${FOTO_DIR}`);
  
  const token = await getSupabaseToken();
  const prodRes = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id,sku,category_id,image_url`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` }
  });
  const products = await prodRes.json();
  console.log(`Loaded ${products.length} products from Supabase.`);
  
  const skuFolders = fs.readdirSync(FOTO_DIR).filter(f => fs.statSync(path.join(FOTO_DIR, f)).isDirectory());
  
  let categoryImageMap = {}; 
  let updatedProducts = 0;
  let alreadySynced = 0;
  let noFolderCount = 0;
  
  for (let i = 0; i < products.length; i++) {
    const prod = products[i];
    
    // Check if already uploaded and synced to R2
    if (prod.image_url && prod.image_url.includes('r2.dev')) {
      alreadySynced++;
      if (prod.category_id && !categoryImageMap[prod.category_id]) {
        categoryImageMap[prod.category_id] = prod.image_url;
      }
      console.log(`[${i+1}/${products.length}] [SKIPPED] SKU ${prod.sku} already has R2 image.`);
      continue;
    }
    
    const baseSku = (prod.sku || '').split(' ')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    
    const matchFolder = skuFolders.find(f => {
      const fNoParens = f.replace(/\([^)]*\)/g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const fFirstWord = f.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      return fNoParens === baseSku || fFirstWord === baseSku;
    });

    if (matchFolder) {
      console.log(`[${i+1}/${products.length}] [PROCESSING] SKU: ${prod.sku} -> Folder: ${matchFolder}`);
      const skuPath = path.join(FOTO_DIR, matchFolder);
      const files = fs.readdirSync(skuPath).filter(f => f.match(/\.(jpg|jpeg|png)$/i));
      
      if (files.length > 0) {
        let r2ImageUrls = [];
        let mainFile = files.find(f => f.toLowerCase().startsWith(matchFolder.toLowerCase() + '.') || f.toLowerCase() === matchFolder.toLowerCase() + '.jpg' || f.toLowerCase() === matchFolder.toLowerCase() + '.png');
        if (!mainFile) mainFile = files[0];
        
        let primaryR2Url = '';

        for (const file of files) {
          const filePath = path.join(skuPath, file);
          const r2Key = `produk/${encodeURIComponent(matchFolder)}/${encodeURIComponent(file)}`;
          
          try {
             const publicUrl = await uploadFileToR2(filePath, r2Key);
             r2ImageUrls.push(publicUrl);
             if (file === mainFile) {
               primaryR2Url = publicUrl;
             }
          } catch (e) {
             console.error(`Final Error uploading file: ${file}:`, e.message);
          }
        }
        
        if (primaryR2Url) {
          r2ImageUrls = [primaryR2Url, ...r2ImageUrls.filter(u => u !== primaryR2Url)];
        }
        
        if (prod.category_id && primaryR2Url && !categoryImageMap[prod.category_id]) {
           categoryImageMap[prod.category_id] = primaryR2Url;
        }

        const freshToken = await getSupabaseToken();
        const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${prod.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${freshToken}`
          },
          body: JSON.stringify({ image_url: primaryR2Url, image_urls: r2ImageUrls })
        });
        
        if (patchRes.ok) {
          console.log(`[${i+1}/${products.length}] [SUCCESS] Supabase Product [${prod.sku}] Updated with R2 URL!`);
          updatedProducts++;
        } else {
          console.error(`  -> Failed to update Supabase Product [${prod.sku}]:`, await patchRes.text());
        }
      }
    } else {
      console.log(`[${i+1}/${products.length}] [NO FOLDER] SKU ${prod.sku} does not match any local photo folder.`);
      noFolderCount++;
    }
  }
  
  console.log(`--- Finished Products Sync. Already Synced: ${alreadySynced}, Newly Updated: ${updatedProducts}, No Folder: ${noFolderCount} ---`);
  
  let updatedCategories = 0;
  for (const catId in categoryImageMap) {
     const catImage = categoryImageMap[catId];
     const freshToken = await getSupabaseToken();
     const res = await fetch(`${SUPABASE_URL}/rest/v1/categories?id=eq.${catId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${freshToken}`
        },
        body: JSON.stringify({ image_url: catImage })
      });
      if (res.ok) {
        console.log(`  -> Category [${catId}] image updated to R2!`);
        updatedCategories++;
      }
  }
  
  console.log(`--- Finished Categories Sync. Total Categories Updated: ${updatedCategories} ---`);
  console.log(`=== ALL DONE! CLOUDFLARE R2 UPLOAD & SYNC COMPLETED SUCCESSFULLY! ===`);
}

run().catch(err => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});