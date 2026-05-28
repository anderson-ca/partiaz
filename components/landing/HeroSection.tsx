import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'

/**
 * Hero — typography-led, no image. Headline dominates first viewport
 * paint; subhead is clearly secondary; CTAs distinct (primary brand-
 * filled, secondary text-link). Animated brand-tinted orb sits behind
 * the copy at -z-10 — `landing-orb` class is defined in globals.css
 * inside a prefers-reduced-motion: no-preference media query so
 * motion-averse users get a static orb.
 */
export async function HeroSection({ locale }: { locale: string }) {
  const t = await getTranslations('landing.hero')
  const signupHref = `/${locale}/login?next=${encodeURIComponent(`/${locale}/events/new`)}`
  const signinHref = `/${locale}/login`

  return (
    <section className="relative overflow-hidden px-4 pt-40 pb-32 md:px-6">
      {/* Brand orb — animated radial gradient. Wide + tall so it bleeds
          past the hero copy on all sides. Stays behind everything via
          -z-10 (the page's body gradient is below that). */}
      <div
        aria-hidden
        className="landing-orb pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[80vh] w-[80vh] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(closest-side, oklch(0.606 0.235 292 / 0.30) 0%, oklch(0.606 0.235 292 / 0.10) 50%, transparent 75%)',
        }}
      />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight text-white md:text-7xl">
          {t('headline')}
        </h1>
        <p className="mt-6 text-lg text-foreground-muted md:text-xl">
          {t('subhead')}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <Button
            asChild
            size="lg"
            className="bg-brand-500 px-6 hover:bg-brand-600"
          >
            <Link href={signupHref}>{t('ctaPrimary')}</Link>
          </Button>
          <Link
            href={signinHref}
            className="text-sm font-medium text-foreground-muted underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            {t('ctaSecondary')}
          </Link>
        </div>
      </div>
    </section>
  )
}
