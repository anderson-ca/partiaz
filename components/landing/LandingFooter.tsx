import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { LocaleSwitcher } from '@/components/navigation/LocaleSwitcher'

/**
 * Landing-only marketing footer. Heavier than the chrome Footer used on
 * app routes — more vertical breathing, includes a tagline left of the
 * wordmark, and a locale switcher on the right (chrome routes have the
 * switcher in the navbar; landing's nav is minimalist, so the switcher
 * appears in the footer here for symmetry).
 *
 * Wordmark icon uses /favicon-96x96.png (raster, brand colors baked in) —
 * same treatment as the chrome footer per the [ui-footer-fix] decision.
 */
export async function LandingFooter({ locale }: { locale: string }) {
  const t = await getTranslations('landing.footer')
  const year = new Date().getFullYear()
  const signinHref = `/${locale}/login`

  return (
    <footer className="border-t border-border-faint">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-12 text-sm md:flex-row md:px-6">
        <div className="flex flex-col items-center gap-3 md:items-start">
          <div className="flex items-center gap-2">
            <Image
              src="/favicon-96x96.png"
              alt=""
              width={24}
              height={24}
              className="shrink-0"
            />
            <span className="text-base font-semibold tracking-tight text-white">
              PartiAZ
            </span>
          </div>
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
