/**
 * Validate a `next` redirect target. Accepts only single-leading-slash
 * relative paths — rejects protocol-relative `//evil.com/path` (which
 * `NextResponse.redirect` would happily follow cross-origin) and
 * Windows-style backslash escapes that some routers normalize oddly.
 *
 * Returns true narrowing the type to `string`; false for null/undefined or
 * any unsafe shape. Callers should fall back to a known-safe default when
 * this returns false.
 *
 * Used by:
 *   - `/auth/callback` route (Prompt 02.5 hardening)
 *   - login page + magic-link / OAuth `next` plumbing (Prompt 08.05)
 */
export function isSafeRelativePath(
  value: string | null | undefined,
): value is string {
  if (!value) return false
  return (
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.startsWith('/\\')
  )
}
