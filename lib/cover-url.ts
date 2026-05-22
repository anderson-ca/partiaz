// Cover-URL resize helper for Unsplash-hosted images.
//
// Why this exists: the `cover_illustrations` seed stores URLs with
// `?w=1760` (Unsplash's "Full" variant), but every surface we render at
// is much smaller than that. Before [perf-1] every grid thumbnail and
// every editor-preview load was fetching a ~1760-px source through
// Vercel's image optimizer, which serially fetched-then-transcoded
// upstream. Cold-cache pile-up was the dominant cost.
//
// We rewrite the `w` query param at READ time, per-surface, so the
// optimizer (and any direct fetch) pulls a source that's already close
// to the display size. Non-Unsplash URLs (uploaded covers, Giphy MP4s)
// pass through unchanged — the helper's early return is the safety net.
//
// No DB migration. Trivial to roll back.

export type CoverThumbSize = 'grid' | 'apply' | 'public' | 'og'

// Width presets sized for 2× DPR displays so a Retina screen still
// renders crisply. Each is a deliberate compromise — bumping up costs
// more bytes through the optimizer, bumping down risks visible blur on
// high-DPR mobile.
const WIDTH_PRESETS: Record<CoverThumbSize, number> = {
  grid: 240, // 4-col mobile grid cell ~120px × 2× DPR
  apply: 800, // editor preview ~400px × 2× DPR
  public: 1200, // public event page hero ~600px × 2× DPR
  og: 1200, // OG image card 1200×630 (per [11c.5])
}

/**
 * Rewrite an Unsplash CDN URL's width parameter for a target display
 * size. Pass-through for non-Unsplash URLs (uploaded covers, Giphy
 * MP4s, Supabase Storage, etc).
 *
 * Preserves `q`, `auto`, `fit`, `ixlib`, etc — only `w` is overwritten,
 * and `h` is removed so Unsplash respects aspect ratio.
 */
export function resizeCoverUrl(url: string, size: CoverThumbSize): string {
  if (!url.includes('images.unsplash.com')) return url
  try {
    const u = new URL(url)
    u.searchParams.set('w', String(WIDTH_PRESETS[size]))
    u.searchParams.delete('h')
    return u.toString()
  } catch {
    return url
  }
}
