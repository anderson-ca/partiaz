'use server'

import 'server-only'

const GIPHY_API_BASE = 'https://api.giphy.com/v1/gifs'

export type GiphyResult = {
  id: string
  title: string
  /** MP4 URL — what we save as the cover_image_url. CoverImage's URL
   *  dispatcher routes this to a <video> tag; smaller and more efficient
   *  than serving the .gif. */
  mp4_url: string
  /** Animated GIF URL — used only as the picker thumbnail so the user can
   *  see motion before committing. Not stored. */
  preview_gif_url: string
  /** Static frame fallback (poster / reduced-motion / load failure). */
  still_url: string
}

export type GiphyError = 'no_api_key' | 'network' | 'parse'

export type GiphySearchResult =
  | { ok: true; results: GiphyResult[] }
  | { ok: false; error: GiphyError }

/**
 * Server-routed Giphy search. The API key never reaches the client.
 *
 * Empty/whitespace query → /trending feed (Giphy's curated default), so the
 * tab is never empty on first open. PG-13 rating cap is the right floor for
 * a wedding/birthday/holiday invitation app.
 *
 * Cached for 5 minutes per (query, offset) pair to keep us well under
 * Giphy's free-tier rate limits during dev iteration.
 */
export async function searchGiphy(
  query: string,
  offset: number = 0,
): Promise<GiphySearchResult> {
  const apiKey = process.env.GIPHY_API_KEY
  if (!apiKey) return { ok: false, error: 'no_api_key' }

  const trimmed = query.trim()
  const isEmpty = trimmed.length === 0
  const params = new URLSearchParams({
    api_key: apiKey,
    limit: '25',
    offset: String(offset),
    rating: 'pg-13',
  })
  if (!isEmpty) params.set('q', trimmed)

  const endpoint = `${GIPHY_API_BASE}/${isEmpty ? 'trending' : 'search'}?${params}`

  try {
    const res = await fetch(endpoint, { next: { revalidate: 300 } })
    if (!res.ok) return { ok: false, error: 'network' }

    const data = (await res.json()) as {
      data: Array<{
        id: string
        title?: string
        images: {
          fixed_width: { mp4?: string; url?: string }
          fixed_width_still: { url?: string }
        }
      }>
    }

    const results: GiphyResult[] = []
    for (const g of data.data) {
      const mp4 = g.images?.fixed_width?.mp4
      const gif = g.images?.fixed_width?.url
      const still = g.images?.fixed_width_still?.url
      // Skip any record missing one of the variants we render with — Giphy
      // very occasionally returns partial assets.
      if (!mp4 || !gif || !still) continue
      results.push({
        id: g.id,
        title: g.title?.trim() || 'GIF',
        mp4_url: mp4,
        preview_gif_url: gif,
        still_url: still,
      })
    }
    return { ok: true, results }
  } catch {
    return { ok: false, error: 'parse' }
  }
}
