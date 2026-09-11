/**
 * Helper to resolve and optimize image URLs across all mobile devices and networks in Indonesia.
 * - Handles Cloudflare R2 domains blocked by Indonesian ISPs (Trust Positif / DNS hijacking)
 * - Automatically encodes spaces and special characters
 * - Routes via admin web image proxy when available
 */

export const ADMIN_WEB_PROXY = 'https://projectn2ndaf.vercel.app/api/image';

export function resolveImageUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  // Local assets or base64
  if (trimmed.startsWith('file:') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Supabase storage URLs work natively in Indonesia without ISP blocking
  if (trimmed.includes('supabase.co/storage/v1/object/public')) {
    return encodeURI(trimmed);
  }

  // Cloudflare R2 public dev domain is frequently blocked by Indonesian ISPs (Telkomsel, Indihome, etc.)
  // and subject to Cloudflare Bot Challenges (HTTP 403)
  if (trimmed.includes('r2.dev')) {
    try {
      const parsed = new URL(trimmed);
      const key = parsed.pathname.replace(/^\//, '');
      return `${ADMIN_WEB_PROXY}?key=${encodeURIComponent(decodeURIComponent(key))}`;
    } catch {
      return `${ADMIN_WEB_PROXY}?url=${encodeURIComponent(trimmed)}`;
    }
  }

  // Default: ensure valid URL encoding (spaces, unicode)
  try {
    return encodeURI(decodeURI(trimmed));
  } catch {
    return trimmed.replace(/ /g, '%20');
  }
}
