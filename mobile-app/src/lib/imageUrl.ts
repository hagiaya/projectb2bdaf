/**
 * Helper to resolve and optimize image URLs across all mobile devices and networks in Indonesia.
 * 
 * Root cause of image failure on other smartphones:
 * 1. Cloudflare R2's default public domain (*.r2.dev) is BLOCKED across Indonesian mobile carriers 
 *    (Telkomsel, Indihome, XL, Axis, Indosat, Tri, Smartfren) by Kominfo / Trust Positif (DNS/DPI drop).
 * 2. Previous hardcoded Vercel proxy URL (projectn2ndaf.vercel.app) returned 404 (DEPLOYMENT_NOT_FOUND).
 * 
 * Solution:
 * - Route R2 image requests through high-performance global CDN edge image proxy (wsrv.nl / images.weserv.nl)
 *   which is completely unblocked in Indonesia and serves optimized WebP from Singapore/Jakarta Cloudflare edge.
 * - Supports optional custom proxy via EXPO_PUBLIC_IMAGE_PROXY_URL if configured.
 */

export const CUSTOM_PROXY = process.env.EXPO_PUBLIC_IMAGE_PROXY_URL;

export function resolveImageUrl(url?: string | null, retryStage: number = 0): string | null {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  // Local assets, base64, or blob
  if (trimmed.startsWith('file:') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Supabase storage URLs work natively in Indonesia without ISP blocking
  if (trimmed.includes('supabase.co/storage/v1/object/public')) {
    return encodeURI(trimmed);
  }

  // Cloudflare R2 public dev domain (*.r2.dev) is blocked by Indonesian ISPs
  if (trimmed.includes('r2.dev')) {
    const cleanUrl = trimmed.includes(' ') ? trimmed.replace(/ /g, '%20') : trimmed;

    // Optional custom proxy (e.g. self-hosted admin-web)
    if (CUSTOM_PROXY && retryStage === 0) {
      try {
        const parsed = new URL(trimmed);
        const key = parsed.pathname.replace(/^\//, '');
        return `${CUSTOM_PROXY}?key=${encodeURIComponent(decodeURIComponent(key))}`;
      } catch {
        return `${CUSTOM_PROXY}?url=${encodeURIComponent(cleanUrl)}`;
      }
    }

    // Stage 0: wsrv.nl CDN edge proxy (unblocked in Indonesia, optimized WebP)
    if (retryStage === 0 || (retryStage === 1 && CUSTOM_PROXY)) {
      return `https://wsrv.nl/?url=${cleanUrl}&output=webp&q=80`;
    }

    // Stage 1: images.weserv.nl mirror
    if (retryStage === 1 || (retryStage === 2 && CUSTOM_PROXY)) {
      return `https://images.weserv.nl/?url=${cleanUrl}&output=webp&q=80`;
    }

    // Stage 2: Direct fallback
    return cleanUrl;
  }

  // Default: ensure valid URL encoding (spaces, unicode)
  try {
    return encodeURI(decodeURI(trimmed));
  } catch {
    return trimmed.replace(/ /g, '%20');
  }
}
