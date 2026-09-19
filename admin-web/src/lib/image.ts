/**
 * Helper utility to reliably resolve and proxy product and category images in admin-web.
 * 
 * Cloudflare R2 development domains (*.r2.dev) are blocked by Indonesian ISPs at DNS/DPI level.
 * In admin-web, this helper routes those URLs through the Next.js server route `/api/image`,
 * which securely fetches the image stream via AWS S3 SDK (using S3 endpoint r2.cloudflarestorage.com)
 * without being blocked by ISP, complete with HTTP 200 and long-term browser cache.
 */

export function getProductImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Already a relative API proxy URL
  if (trimmed.startsWith('/api/image')) return trimmed;

  // Route Cloudflare R2 dev domains and direct S3 endpoints through internal API proxy
  if (trimmed.includes('r2.dev') || trimmed.includes('cloudflarestorage.com')) {
    return `/api/image?url=${encodeURIComponent(trimmed)}`;
  }

  return trimmed;
}

/**
 * Extracts a normalized list of valid image URLs from a product object,
 * handling both legacy singular `image_url` and modern array `image_urls`.
 */
export function getProductImages(product?: { 
  image_urls?: string[] | null; 
  image_url?: string | null; 
} | null): string[] {
  if (!product) return [];

  const list: string[] = [];

  if (Array.isArray(product.image_urls) && product.image_urls.length > 0) {
    for (const u of product.image_urls) {
      if (u && typeof u === 'string' && u.trim()) {
        list.push(u.trim());
      }
    }
  }

  if (list.length === 0 && product.image_url && typeof product.image_url === 'string' && product.image_url.trim()) {
    list.push(product.image_url.trim());
  }

  return list;
}

/**
 * Returns the primary thumbnail URL for a product or category.
 */
export function getPrimaryProductImage(product?: { 
  image_urls?: string[] | null; 
  image_url?: string | null; 
} | null): string {
  const images = getProductImages(product);
  return images.length > 0 ? getProductImageUrl(images[0]) : '';
}
