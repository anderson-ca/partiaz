import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { BakuSection } from '@/components/landing/BakuSection'
import { FinalCtaSection } from '@/components/landing/FinalCtaSection'
import { HeroSection } from '@/components/landing/HeroSection'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { LandingNav } from '@/components/landing/LandingNav'
import { ShowcaseSection } from '@/components/landing/ShowcaseSection'
import { ValuePropSection } from '@/components/landing/ValuePropSection'
import { Logo } from '@/components/navigation/Logo'
import { createClient } from '@/lib/supabase/server'

// Root landing page. Lives at `app/[locale]/page.tsx` (NOT inside the
// (with-nav) group) so it inherits only the [locale]/layout.tsx root —
// no chrome navbar/footer. The landing brings its own minimal sticky
// nav + heavier marketing footer.
//
// Authed visitors at `/` still auto-redirect to /events — the landing
// is anon-visitor territory.

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    redirect(`/${locale}/events`)
  }

  return (
    <div className="relative min-h-dvh">
      <LandingNav locale={locale} logo={<Logo />} />
      <main>
        <HeroSection locale={locale} />
        <ShowcaseSection />
        <ValuePropSection />
        <BakuSection />
        <FinalCtaSection locale={locale} />
      </main>
      <LandingFooter locale={locale} />
    </div>
  )
}
