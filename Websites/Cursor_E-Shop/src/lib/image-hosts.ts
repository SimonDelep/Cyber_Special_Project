/** Hostnames allowed for `next/image` optimization. Others use a native `<img>`. */
export const NEXT_IMAGE_HOSTS = new Set([
  "images.unsplash.com",
  "media.materiel.net",
]);

export function canUseNextImage(src: string): boolean {
  try {
    const { hostname, protocol } = new URL(src);
    return protocol === "https:" && NEXT_IMAGE_HOSTS.has(hostname);
  } catch {
    return false;
  }
}
