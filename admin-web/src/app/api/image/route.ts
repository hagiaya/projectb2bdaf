import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || 'ac6dc537a597c14bf179f608558e1379';
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '5b356585d16a95f4912dd27768b96de0';
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '12e0d85296d1e7e2ae274776d14149dd573e1cab29e53cb7a1a4777defb487d3';
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'b2b-produk-images';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let key = searchParams.get('key');
  const rawUrl = searchParams.get('url');

  if (!key && rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      key = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
    } catch {
      key = rawUrl;
    }
  }

  if (!key) {
    return new NextResponse('Missing key or url parameter', { status: 400 });
  }

  // Ensure key is properly decoded
  key = decodeURIComponent(key);

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const s3Response = await s3Client.send(command);

    if (!s3Response.Body) {
      return new NextResponse('Image not found', { status: 404 });
    }

    // transformToWebStream is built-in in AWS SDK v3
    const stream = s3Response.Body.transformToWebStream();

    const headers = new Headers();
    headers.set('Content-Type', s3Response.ContentType || 'image/jpeg');
    if (s3Response.ContentLength) {
      headers.set('Content-Length', String(s3Response.ContentLength));
    }
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('Access-Control-Allow-Origin', '*');

    return new NextResponse(stream as any, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Error fetching image from R2:', error?.message);
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return new NextResponse('Image not found', { status: 404 });
    }
    return new NextResponse('Failed to load image: ' + error?.message, { status: 500 });
  }
}
