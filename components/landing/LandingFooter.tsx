import { getTranslations } from 'next-intl/server'

/**
 * Landing-only marketing footer. Heavier than the chrome Footer used on
 * app routes — more vertical breathing and a tagline on the left.
 *
 * The brand-mark lockup was removed ([bug-004]) once the nav adopted the icon
 * logo — the footer mark was a redundant duplicate. The locale switcher and
 * sign-in link were also dropped (both already live in the landing nav), so the
 * footer carries just the tagline and copyright.
 */
export async function LandingFooter() {
  const t = await getTranslations('landing.footer')
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border-faint">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-12 text-sm md:flex-row md:px-6">
        <p className="text-center text-foreground-subtle md:text-left">
          {t('tagline')}
        </p>
        <span className="text-xs text-foreground-faint">© {year} PartiAZ</span>
      </div>
    </footer>
  )
}
