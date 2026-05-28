'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { LocaleSwitcher } from '@/components/navigation/LocaleSwitcher'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const SCROLL_THRESHOLD = 32

type LandingNavProps = {
  locale: string
}

/**
 * Landing-only sticky nav. Transparent at the top of the page, becomes a
 * surface-nav (existing token) with backdrop-blur after the user scrolls
 * past the threshold — gives the hero room to breathe at rest, then
 * delineates content from chrome when scrolled.
 *
 * Client component because of the scroll listener. Initial state mirrors
 * SSR output (transparent), so no hydration mismatch.
 */
export function LandingNav({ locale }: LandingNavProps) {
  const t = useTranslations('landing.nav')
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > SCROLL_THRESHOLD)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const signupHref = `/${locale}/login?next=${encodeURIComponent(`/${locale}/events/new`)}`
  const signinHref = `/${locale}/login`

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-200',
        scrolled
          ? 'border-b border-border-faint bg-surface-nav backdrop-blur-2xl'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <Image
            src="/favicon-96x96.png"
            alt=""
            width={28}
            height={28}
            className="shrink-0"
          />
          <span className="text-base font-semibold tracking-tight text-white">
            PartiAZ
          </span>
        </Link>

        <div className="flex items-center gap-1 md:gap-2">
          <LocaleSwitcher />
          <Link
            href={signinHref}
            className="hidden h-9 items-center rounded-full px-3 text-sm font-medium text-foreground-muted transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40 sm:inline-flex"
          >
            {t('signIn')}
          </Link>
          <Button asChild className="bg-brand-500 hover:bg-brand-600">
            <Link href={signupHref}>{t('getStarted')}</Link>
          </Button>
        </div>
      </nav>
    </header>
  )
}
