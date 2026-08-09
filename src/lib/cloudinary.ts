const CLOUD_NAME = "fizhgwxs";

/**
 * Wraps a Supabase (or any external) image URL through Cloudinary's fetch delivery.
 * Cloudinary fetches the original, optimizes (auto format + quality), resizes, caches on CDN.
 *
 * @param url - Original image URL (e.g. Supabase storage URL)
 * @param width - Desired width in pixels (optional, defaults to auto)
 * @param quality - Quality level (optional, defaults to "auto")
 */
export function cloudinaryUrl(
  url: string | undefined | null,
  width?: number,
  quality: string = "auto"
): string {
  if (!url) return "";

  // Only proxy external URLs (Supabase storage)
  // Skip local/public images (they start with /)
  if (url.startsWith("/")) return url;

  // Build transformation string
  const transforms: string[] = ["f_auto", `q_${quality}`];
  if (width) transforms.push(`w_${width}`, "c_limit");

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/${transforms.join(",")}/${encodeURIComponent(url)}`;
}
