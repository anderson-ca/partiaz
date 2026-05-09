'use client'

import { useTransition } from 'react'
import { Check, Globe } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
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

export function LocaleSwitcher() {
  const t = useTranslations('nav')
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = useLocale() as Locale
  const [pending, startTransition] = useTransition()

  function changeLocale(next: Locale) {
    if (next === currentLocale) return
    startTransition(() => {
      // next-intl's locale-aware router strips the current locale prefix
      // from the URL, then re-adds the new one. `pathname` here is the
      // already-resolved string (e.g. `/events/abc123/edit`), not the
      // route template, so dynamic segments survive the swap.
      router.replace(pathname, { locale: next })
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('languageMenuLabel')}
          disabled={pending}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-all duration-150 hover:bg-white/10 active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40 disabled:opacity-50"
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
