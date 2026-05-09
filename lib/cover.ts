/**
 * URL-shape dispatcher shared by the CoverImage renderer and any other
 * surface (dashboard card, etc.) that needs to decide between <video> and
 * <img> for a saved cover URL.
 *
 * Match is on `pathname.endsWith('.mp4')` so query strings on Unsplash-style
 * URLs (`...?w=600&fm=jpg`) don't false-match. Anything that doesn't parse
 * as a URL (relative paths, blob: URLs, etc.) falls through to the image
 * branch.
 */
export function isVideoCoverUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase()
    return path.endsWith('.mp4')
  } catch {
    return false
  }
}
