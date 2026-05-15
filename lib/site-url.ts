/**
 * Resolve the canonical site URL for server-side URL construction (invite
 * links, OG metadata, anywhere we need to embed an absolute parti.az URL
 * in outbound content).
 *
 * Reads `NEXT_PUBLIC_SITE_URL` at runtime. NO fallback — if the env var is
 * missing in the deployed environment, the caller throws and the failure
 * is loud and immediate, instead of silently shipping `http://localhost:3000`
 * in production SMS bodies (the bug fixed in [11c.7]).
 *
 * Local dev should still set this in `.env.local`; Vercel sets it via
 * project env config (scoped Production / Preview / Development).
 *
 * Strips a single trailing slash so callers can write `${getSiteUrl()}/e/...`
 * without worrying about whether the env value ended with `/`.
 */
export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL
  if (!url) {
    throw new Error('NEXT_PUBLIC_SITE_URL env var is not set')
  }
  return url.replace(/\/$/, '')
}
