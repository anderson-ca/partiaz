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
  'border border-white/10 bg-zinc-900/95 text-white shadow-2xl backdrop-blur-xl'

/**
 * Companion mapping for shadcn neutral tokens when used INSIDE a
 * FLOATING_SURFACE container. Use these instead of `text-foreground` /
 * `bg-muted` / `ring-foreground` / `text-destructive` etc., which would
 * resolve against the (unused) light theme.
 */
export const ON_FLOATING = {
  textPrimary: 'text-white',
  textSecondary: 'text-white/70',
  textMuted: 'text-white/50',
  border: 'border-white/10',
  borderStrong: 'border-white/30',
  ring: 'ring-white ring-offset-zinc-900',
  bgSubtle: 'bg-white/5',
  bgError: 'text-red-400',
} as const
