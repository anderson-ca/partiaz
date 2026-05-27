import Image from 'next/image'
import { FOOTER_SURFACE } from '@/lib/ui/floating-surface'
import { cn } from '@/lib/utils'

/**
 * Minimal app-route footer. Mounted in `(with-nav)/layout.tsx` only —
 * auth routes (no shared layout) intentionally render chrome-less.
 *
 * Scope is intentionally restrained: brand-mark lockup + copyright. No
 * privacy/terms/help links until those pages exist — placeholder links
 * are worse UX than no links. Locale switcher is omitted because the
 * navbar's is always sticky-visible.
 *
 * Brand mark: served via the existing public/favicon-96x96.png asset
 * (raster, brand colors baked in). The icon's not text-brand-400-
 * recolorable because the underlying app/icon.svg is a base64 PNG
 * wrapped in SVG, not a true vector — accepted as the cleaner pragmatic
 * path vs creating a new vector asset.
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
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-sm md:flex-row md:px-6">
        <div className="flex items-center gap-2">
          <Image
            src="/favicon-96x96.png"
            alt=""
            width={20}
            height={20}
            className="shrink-0"
          />
          <span className="font-semibold tracking-tight text-white">
            PartiAZ
          </span>
        </div>
        <span className="text-foreground-subtle">
          © {new Date().getFullYear()} PartiAZ
        </span>
      </div>
    </footer>
  )
}
