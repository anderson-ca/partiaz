'use client'

import { useEffect, useState, useTransition } from 'react'
import { Check, Globe } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePathname, useRouter, routing } from '@/i18n/routing'
import { FLOATING_SURFACE } from '@/lib/ui/floating-surface'
import { cn } from '@/lib/utils'

type Locale = (typeof routing.locales)[number]

// Native-script labels for each locale. Stays the same regardless of which
// locale the user is currently viewing — that's the point.
const LOCALE_LABELS: Record<Locale, string> = {
  az: 'Azərbaycanca',
  ru: 'Русский',
  en: 'English',
}

const TRIGGER_CLASS =
  'flex h-9 w-9 items-center justify-center rounded-full text-white transition-all duration-150 hover:bg-white/10 active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40 disabled:opacity-50'

export function LocaleSwitcher() {
  const t = useTranslations('nav')
  const router = useRouter()
  const pathname = usePathname()
  // `useSearchParams` comes from `next/navigation` (Next.js core) rather
  // than `@/i18n/routing` — search params are locale-independent and
  // next-intl's router doesn't re-export the hook. Preserving them is
  // important for tokenized invite URLs (`/e/{slug}?t={token}`): without
  // this, switching locale drops `?t=...` and the next-locale event page
  // 404s ([11d.1]).
  const searchParams = useSearchParams()
  const currentLocale = useLocale() as Locale
  const [pending, startTransition] = useTransition()

  // Pre-mount: render the bare trigger only, no DropdownMenu wrapper. The
  // Radix Root calls `useId()` for the trigger ↔ content aria-controls
  // relationship; if that id differs SSR vs client (which can happen when
  // upstream client components in the tree — Sonner, NextIntlProvider —
  // mount asynchronously and shift the useId counter), hydration fails on
  // the trigger button. Holding off the wrapper until post-mount makes SSR
  // and first paint identical (bare button, no Radix ids), eliminating the
  // mismatch. Same pattern as ResponsivePicker (CLAUDE.md).
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  function changeLocale(next: Locale) {
    if (next === currentLocale) return
    startTransition(() => {
      // next-intl's locale-aware router strips the current locale prefix
      // from the URL, then re-adds the new one. `pathname` here is the
      // already-resolved string (e.g. `/events/abc123/edit`), not the
      // route template, so dynamic segments survive the swap.
      // Append the current search params so query state survives the
      // swap too (`?t=<invite-token>`, future `?q=...`, etc).
      const search = searchParams.toString()
      const target = search ? `${pathname}?${search}` : pathname
      router.replace(target, { locale: next })
    })
  }

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label={t('languageMenuLabel')}
        disabled
        className={TRIGGER_CLASS}
      >
        <Globe className="h-4 w-4" />
      </button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('languageMenuLabel')}
          disabled={pending}
          className={TRIGGER_CLASS}
        >
          <Globe className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className={cn(FLOATING_SURFACE, 'min-w-44 rounded-xl p-1')}
      >
        <DropdownMenuLabel className="px-2 py-1.5 text-xs uppercase tracking-wide text-white/50">
          {t('languageMenuLabel')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        {routing.locales.map((loc) => {
          const isActive = loc === currentLocale
          return (
            <DropdownMenuItem
              key={loc}
              onClick={() => changeLocale(loc)}
              className="gap-2 rounded-lg px-2 py-1.5 text-sm text-white focus:bg-white/10 focus:text-white"
            >
              <Check
                className={cn(
                  'h-3.5 w-3.5 transition-opacity',
                  isActive ? 'opacity-100' : 'opacity-0',
                )}
              />
              {LOCALE_LABELS[loc]}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
