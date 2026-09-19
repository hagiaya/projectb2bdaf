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

  // 1. External fallback URL (e.g. placehold.co or other CDNs)
  if (rawUrl && !rawUrl.includes('r2.dev') && !rawUrl.includes('cloudflarestorage.com')) {
    try {
      const extRes = await fetch(rawUrl);
      if (extRes.ok && extRes.body) {
        const headers = new Headers();
        headers.set('Content-Type', extRes.headers.get('content-type') || 'image/png');
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('Access-Control-Allow-Origin', '*');
        return new NextResponse(extRes.body as any, { status: 200, headers });
      }
    } catch {
      // If external fetch fails, continue to key resolution
    }
  }

  // 2. Extract potential keys from URL or key parameter
  const candidates: string[] = [];

  if (key) {
    candidates.push(key);
    try { candidates.push(decodeURIComponent(key)); } catch {}
  }

  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      const rawPath = parsed.pathname.replace(/^\//, '');
      candidates.push(rawPath);
      try { candidates.push(decodeURIComponent(rawPath)); } catch {}
      try { candidates.push(decodeURIComponent(decodeURIComponent(rawPath))); } catch {}
      try { candidates.push(encodeURI(decodeURIComponent(rawPath))); } catch {}
    } catch {
      candidates.push(rawUrl);
    }
  }

  const uniqueCandidates = Array.from(new Set(candidates)).filter(Boolean);

  if (uniqueCandidates.length === 0) {
    return new NextResponse('Missing key or url parameter', { status: 400 });
  }

  // 3. Try each candidate key on R2
  for (const candidateKey of uniqueCandidates) {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: candidateKey,
      });

      const s3Response = await s3Client.send(command);

      if (s3Response.Body) {
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
      }
    } catch (error: any) {
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        continue;
      }
      console.error(`Error fetching key "${candidateKey}" from R2:`, error?.message);
    }
  }

  // Return clean, elegant SVG placeholder image so browser never shows broken icon
  const svgPlaceholder = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="none">
    <rect width="400" height="400" fill="#F8FAFC"/>
    <rect x="1" y="1" width="398" height="398" rx="16" stroke="#E2E8F0" stroke-width="2"/>
    <g transform="translate(140, 130)" stroke="#94A3B8" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <rect x="0" y="0" width="120" height="100" rx="12"/>
      <circle cx="35" cy="35" r="10"/>
      <path d="M120 75 L90 45 L25 100"/>
    </g>
    <text x="200" y="270" text-anchor="middle" fill="#64748B" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600">Gambar Tidak Ditemukan</text>
  </svg>`;

  const fallbackHeaders = new Headers();
  fallbackHeaders.set('Content-Type', 'image/svg+xml');
  fallbackHeaders.set('Cache-Control', 'public, max-age=60');
  fallbackHeaders.set('Access-Control-Allow-Origin', '*');

  return new NextResponse(svgPlaceholder, { status: 200, headers: fallbackHeaders });
}
