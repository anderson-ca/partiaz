'use client'

import { useEffect, useState, useTransition, type ComponentType } from 'react'
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
import { FlagAz } from './FlagAz'
import { FlagRu } from './FlagRu'
import { FlagGb } from './FlagGb'

type Locale = (typeof routing.locales)[number]

// Native-script labels for each locale. Stays the same regardless of which
// locale the user is currently viewing — that's the point.
const LOCALE_LABELS: Record<Locale, string> = {
  az: 'Azərbaycanca',
  ru: 'Русский',
  en: 'English',
}

// Flag artwork per locale. `en` maps to the UK flag (Union Jack).
const FLAG_BY_LOCALE: Record<Locale, ComponentType<{ className?: string }>> = {
  az: FlagAz,
  ru: FlagRu,
  en: FlagGb,
}

// 4×3 flag footprint — matches the previous trigger icon's visual weight
// (h-4) while keeping the flag's aspect ratio (w-5 ≈ 4:3).
const FLAG_CLASS = 'h-4 w-5 shrink-0 rounded-[2px]'

const TRIGGER_CLASS =
  'flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-white transition-all duration-150 hover:bg-white/10 active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40 disabled:cursor-not-allowed disabled:opacity-50'

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
  const ActiveFlag = FLAG_BY_LOCALE[currentLocale]
  const triggerLabel = `${t('languageMenuLabel')}: ${LOCALE_LABELS[currentLocale]}`

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
        aria-label={triggerLabel}
        disabled
        className={TRIGGER_CLASS}
      >
        <ActiveFlag className={FLAG_CLASS} aria-hidden="true" />
      </button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={triggerLabel}
          disabled={pending}
          className={TRIGGER_CLASS}
        >
          <ActiveFlag className={FLAG_CLASS} aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className={cn(FLOATING_SURFACE, 'min-w-44 rounded-xl p-1')}
      >
        <DropdownMenuLabel className="px-2 py-1.5 text-xs uppercase tracking-wide text-foreground-subtle">
          {t('languageMenuLabel')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        {routing.locales.map((loc) => {
          const isActive = loc === currentLocale
          const Flag = FLAG_BY_LOCALE[loc]
          return (
            <DropdownMenuItem
              key={loc}
              onClick={() => changeLocale(loc)}
              aria-current={isActive ? 'true' : undefined}
              className={cn(
                'gap-2 rounded-lg px-2 py-1.5 text-sm text-white focus:bg-white/10 focus:text-white',
                isActive && 'bg-brand-400/15',
              )}
            >
              <Flag className={FLAG_CLASS} aria-hidden="true" />
              {LOCALE_LABELS[loc]}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
