import { ImageResponse } from 'next/og'

// 1200×630 violet placeholder served at /og-default.png for events whose
// cover_image_url is null OR points to a video. Plain "PartiAZ" wordmark
// on solid violet; replace with a branded asset later. Lives as a route
// rather than `/public/og-default.png` because we have no SVG-to-PNG
// tooling on dev machines and `next/og` ships with Next 15 — same URL
// contract from any consumer's perspective.
export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#7c3aed',
          color: '#ffffff',
          fontSize: 120,
          fontWeight: 700,
          letterSpacing: '-0.02em',
        }}
      >
        PartiAZ
</div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        // Placeholder never changes; cache hard. Bust via filename change
        // if we ever swap content.
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
  )
}
