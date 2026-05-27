/**
 * Standard styling for floating UI surfaces (Popover/Sheet/Dialog content,
 * DropdownMenu, Tooltip, CommandList, etc.) that overlay the themed page
 * background.
 *
 * The themed background can be any color (dark gradient, pastel photo, neon,
 * etc.). Floating surfaces are intentionally dark-glass on every theme —
 * readable everywhere, never inheriting shadcn's default `bg-popover` token
 * (which resolves to white in our untoggled-light setup and renders
 * illegibly over a themed page).
 */
export const FLOATING_SURFACE =
  'border border-border-subtle bg-surface-floating text-white shadow-2xl backdrop-blur-xl'

/**
 * Glass styling for page-spanning chrome bars (navbar, footer, etc.) — distinct
 * from FLOATING_SURFACE which is tuned for popovers. NAV_SURFACE is more
 * transparent so the themed page background reads through, and uses a
 * subtle border-bottom instead of a full ring.
 */
export const NAV_SURFACE =
  'bg-surface-nav backdrop-blur-xl border-b border-border-faint'

/**
 * Companion mapping for shadcn neutral tokens when used INSIDE a
 * FLOATING_SURFACE container. Use these instead of `text-foreground` /
 * `bg-muted` / `ring-foreground` / `text-destructive` etc., which would
 * resolve against the (unused) light theme.
 */
export const ON_FLOATING = {
  textPrimary: 'text-white',
  textSecondary: 'text-foreground-muted',
  textMuted: 'text-foreground-subtle',
  border: 'border-border-subtle',
  borderStrong: 'border-border-strong',
  ring: 'ring-white ring-offset-zinc-900',
  bgSubtle: 'bg-surface-subtle',
  bgError: 'text-red-400',
} as const
