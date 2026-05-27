import { FOOTER_SURFACE } from '@/lib/ui/floating-surface'
import { cn } from '@/lib/utils'

/**
 * Minimal app-route footer. Mounted in `(with-nav)/layout.tsx` only —
 * auth routes (no shared layout) intentionally render chrome-less.
 *
 * Scope is intentionally restrained: wordmark + copyright. No privacy/
 * terms/help links until those pages exist — placeholder links are worse
 * UX than no links. Locale switcher is also omitted because the navbar's
 * is always sticky-visible; duplicating creates two i18n update targets
 * and visual noise.
 *
 * Surface mirrors NAV_SURFACE but flips the border to the top — composed
 * via FOOTER_SURFACE so the navbar's API stays stable. On the public
 * event page, the per-event ThemeBackground (fixed inset-0 -z-10) reads
 * through this footer's backdrop-blur via the surface's translucent
 * alpha, so the footer integrates with whichever background it sits over.
 */
export function Footer() {
  return (
    <footer className={cn(FOOTER_SURFACE)}>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-foreground-subtle md:flex-row md:px-6">
        <span className="font-semibold tracking-tight text-white">PartiAZ</span>
        <span>© {new Date().getFullYear()} PartiAZ</span>
      </div>
    </footer>
  )
}
