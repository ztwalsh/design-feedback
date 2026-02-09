/**
 * Shared utility functions
 */

/**
 * Detect media type from base64 data URL or default to jpeg
 */
export function detectMediaType(dataUrl: string): 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif' {
  if (dataUrl.startsWith('data:image/png')) return 'image/png';
  if (dataUrl.startsWith('data:image/webp')) return 'image/webp';
  if (dataUrl.startsWith('data:image/gif')) return 'image/gif';
  return 'image/jpeg'; // default for jpg/jpeg
}

/**
 * Strip internal rating markers from displayed content
 * Optimized with single pass regex
 */
export function cleanContent(content: string): string {
  return content
    .replace(/```\s*\n(?:(?:RATING_|VERDICT:)\w*:?.*\n)+```|RATING_(?:OVERALL|VISUAL_DESIGN|HIERARCHY|ACCESSIBILITY|INTERACTION|UX|CONTENT):\s*(?:Strong|Good|Fair|Needs Work)|VERDICT:\s*(?:Ship it|Needs edits|Refocus)/gi, '')
    .trim();
}

/**
 * Extract base64 data from data URL
 */
export function extractBase64(dataUrl: string): string {
  const parts = dataUrl.split(',');
  return parts.length > 1 ? parts[1] : dataUrl;
}
