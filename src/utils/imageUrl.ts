/**
 * Utility to format and resolve asset URLs.
 * Handles:
 * - External absolute URLs (Google Photos, CDN, etc. -> returns as is)
 * - Local static public assets (e.g. 'images/alm_1.jpg' -> prepends Vite base URL)
 * - Base64 and blob URLs
 */
export function formatImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  
  const trimmed = url.trim();
  
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Remove leading slashes and relative dots to prevent root domain resolution on subpaths
  const cleanPath = trimmed.replace(/^(\.|\/)+/, '');
  
  // Get Vite configured base URL
  const baseUrl = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL || './';
  
  if (baseUrl.endsWith('/')) {
    return `${baseUrl}${cleanPath}`;
  }
  
  return `${baseUrl}/${cleanPath}`;
}
