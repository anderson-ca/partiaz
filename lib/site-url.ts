/**
 * Resolve the canonical site URL for server-side URL construction (invite
 * links, OG metadata, anywhere we need to embed an absolute parti.az URL
 * in outbound content).
 *
 * Reads `SITE_URL` at runtime. The var name is deliberately NOT prefixed
 * with `NEXT_PUBLIC_`:
 *
 *   Next.js inlines every `process.env.NEXT_PUBLIC_*` reference into the
 *   compiled bundle at `next build` time via webpack DefinePlugin — for
 *   server bundles too, not just client. Once inlined, runtime env var
 *   changes have NO effect. The [11c.7] version of this helper used
 *   `NEXT_PUBLIC_SITE_URL`; on Vercel that got baked to `http://localhost:3000`
 *   (whatever was in env at that build's time) and shipped wrong URLs in
 *   production SMS bodies until [11c.7.1] renamed the var.
 *
 * Non-public env vars are server-only and read at runtime, so dashboard
 * changes take effect on the next request without rebuilding.
 *
 * Throws if the var is missing — loud, immediate failure instead of
 * silently shipping a localhost or undefined URL.
 *
 * Local dev sets this in `.env.local`; Vercel sets it via project env
 * config (scoped Production / Preview / Development).
 *
 * Strips a single trailing slash so callers can write `${getSiteUrl()}/e/...`
 * without worrying about whether the env value ended with `/`.
 */
export function getSiteUrl(): string {
  const url = process.env.SITE_URL
  if (!url) {
    throw new Error('SITE_URL env var is not set')
  }
  return url.replace(/\/$/, '')
}
