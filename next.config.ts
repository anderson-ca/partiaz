import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // isomorphic-dompurify lazy-loads jsdom server-side; tell Next/Turbopack
  // not to bundle either so they're require()'d at runtime from the
  // project's node_modules. Without this, Turbopack tries to inline jsdom
  // and chokes on its dynamically-loaded default-stylesheet.css ([ui-6b]).
  serverExternalPackages: ['isomorphic-dompurify', 'jsdom'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/photo-**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/flagged/photo-**',
      },
      {
        // Unsplash vector illustrations (cover_illustrations seed). Distinct
        // path namespace from /photo-**; needs its own pattern.
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/vector-**',
      },
      {
        // Supabase Storage public objects: event-covers and any future
        // public bucket. Hostname is project-ref scoped so this whitelist
        // is per-environment safe.
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default withNextIntl(nextConfig)
