const { S3Client, ListObjectsV2Command, CopyObjectCommand } = require('@aws-sdk/client-s3');

const R2_ACCOUNT_ID = 'ac6dc537a597c14bf179f608558e1379';
const ACCESS_KEY_ID = '5b356585d16a95f4912dd27768b96de0';
const SECRET_ACCESS_KEY = '12e0d85296d1e7e2ae274776d14149dd573e1cab29e53cb7a1a4777defb487d3';
const BUCKET_NAME = 'b2b-produk-images';

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

async function main() {
  console.log('Fetching all objects from Cloudflare R2 bucket:', BUCKET_NAME);
  let token;
  const percentKeys = [];
  const existingCleanKeys = new Set();

  do {
    const res = await client.send(new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      ContinuationToken: token,
    }));
    for (const item of res.Contents || []) {
      if (item.Key.includes('%20')) {
        percentKeys.push(item.Key);
      } else {
        existingCleanKeys.add(item.Key);
      }
    }
    token = res.NextContinuationToken;
  } while (token);

  console.log(`Found ${percentKeys.length} keys with %20.`);
  const toCopy = percentKeys.filter(k => !existingCleanKeys.has(decodeURIComponent(k)));
  console.log(`Need to copy: ${toCopy.length} objects.`);

  if (toCopy.length === 0) {
    console.log('All decoded versions already exist!');
    return;
  }

  // Copy concurrently in batches of 25
  const BATCH_SIZE = 25;
  let copied = 0;
  let errors = 0;

  for (let i = 0; i < toCopy.length; i += BATCH_SIZE) {
    const batch = toCopy.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (key) => {
      const targetKey = decodeURIComponent(key);
      try {
        await client.send(new CopyObjectCommand({
          Bucket: BUCKET_NAME,
          CopySource: `${BUCKET_NAME}/${encodeURIComponent(key)}`,
          Key: targetKey,
        }));
        copied++;
      } catch (err) {
        console.error(`Failed copying ${key}:`, err.message);
        errors++;
      }
    }));
    process.stdout.write(`Progress: ${copied}/${toCopy.length} copied (${errors} errors)\r`);
  }

  console.log(`\nDone! Copied: ${copied}, Errors: ${errors}`);
}

main().catch(console.error);
