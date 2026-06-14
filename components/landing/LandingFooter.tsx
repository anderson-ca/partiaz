import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { LocaleSwitcher } from '@/components/navigation/LocaleSwitcher'

/**
 * Landing-only marketing footer. Heavier than the chrome Footer used on
 * app routes — more vertical breathing, a tagline on the left, and a locale
 * switcher on the right (chrome routes have the switcher in the navbar;
 * landing's nav is minimalist, so the switcher appears in the footer here
 * for symmetry).
 *
 * The brand-mark lockup was removed ([bug-004]) once the nav adopted the icon
 * logo — the footer mark was a redundant duplicate; only the copyright remains.
 */
export async function LandingFooter({ locale }: { locale: string }) {
  const t = await getTranslations('landing.footer')
  const year = new Date().getFullYear()
  const signinHref = `/${locale}/login`

  return (
    <footer className="border-t border-border-faint">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-12 text-sm md:flex-row md:px-6">
        <div className="flex flex-col items-center gap-3 md:items-start">
          <p className="text-center text-foreground-subtle md:text-left">
            {t('tagline')}
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 md:items-end">
          <div className="flex items-center gap-3">
            <LocaleSwitcher />
            <Link
              href={signinHref}
              className="text-sm font-medium text-foreground-muted transition-colors hover:text-white"
            >
              {t('signIn')}
            </Link>
          </div>
          <span className="text-xs text-foreground-faint">
            © {year} PartiAZ
          </span>
        </div>
      </div>
    </footer>
  )
}
