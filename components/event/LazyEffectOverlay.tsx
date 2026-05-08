'use client'

import dynamic from 'next/dynamic'

/**
 * Code-split + defer wrapper around <EffectOverlay>.
 *
 * Why this exists:
 *   - `@tsparticles/all` (loaded by EffectOverlay) is a ~50 KB chunk that
 *     dominates the First Load JS of any route that imports the overlay
 *     statically. We hit the threshold flagged in PRODUCT_SPEC.md §26 on
 *     `/e/[slug]` (247 KB) and on the editor (372 KB).
 *   - `dynamic(..., { ssr: false })` requires the *caller* to be a Client
 *     Component. Server Component consumers (the public event page) can't
 *     use it directly. This `'use client'` shim is the boundary that lets
 *     Server and Client Components alike import a lazy-loaded EffectOverlay
 *     with one line.
 *
 * Loading fallback is `null` — effects are decorative, fading in ~100-300 ms
 * after first paint is acceptable. If pop-in feels wrong on a hot path
 * later, the surgical alternative is `loadSlim` + per-effect plugin imports
 * (see CLAUDE.md "Catalog renderer rules" #2).
 */
export const LazyEffectOverlay = dynamic(
  () => import('./EffectOverlay').then((m) => ({ default: m.EffectOverlay })),
  { ssr: false, loading: () => null },
)
