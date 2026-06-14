import { FOOTER_SURFACE } from '@/lib/ui/floating-surface'
import { cn } from '@/lib/utils'

/**
 * Minimal app-route footer. Mounted in `(with-nav)/layout.tsx` only —
 * auth routes (no shared layout) intentionally render chrome-less.
 *
 * Scope is intentionally restrained: copyright only. No privacy/terms/help
 * links until those pages exist — placeholder links are worse UX than no
 * links. Locale switcher is omitted because the navbar's is always
 * sticky-visible. The brand-mark lockup was removed ([bug-004]) once the nav
 * adopted the icon logo — the footer mark was a redundant duplicate.
 *
 * Surface mirrors NAV_SURFACE but flips the border to the top — composed
 * via FOOTER_SURFACE so the navbar's API stays stable. On the public
 * event page, the per-event ThemeBackground (fixed inset-0 -z-10) reads
 * through this footer's backdrop-blur via the surface's translucent
 * alpha, so the footer integrates with whichever background sits behind.
 */
export function Footer() {
  return (
    <footer className={cn(FOOTER_SURFACE)}>
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-5 text-sm md:px-6">
        <span className="text-foreground-subtle">
          © {new Date().getFullYear()} PartiAZ
        </span>
      </div>
    </footer>
  )
}
