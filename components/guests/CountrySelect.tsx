'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  COUNTRIES,
  countryByCode,
  type SupportedCountry,
} from '@/lib/countries'
import { FLOATING_SURFACE } from '@/lib/ui/floating-surface'
import { cn } from '@/lib/utils'

// Re-export the type from here so prompt-spec consumers can also reach it
// via `@/components/guests/CountrySelect`. Canonical home is `@/lib/countries`.
export type { SupportedCountry } from '@/lib/countries'

type CountrySelectProps = {
  value: SupportedCountry
  onChange: (c: SupportedCountry) => void
  /** Extra classes for the trigger — typically used to flatten the right
   *  border when attached to an input as a prefix. */
  className?: string
}

export function CountrySelect({
  value,
  onChange,
  className,
}: CountrySelectProps) {
  const t = useTranslations('events.guests.country')
  const current = countryByCode(value)

  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as SupportedCountry)}
    >
      <SelectTrigger
        aria-label={t('selectAria')}
        className={cn(
          // Match the input it sits next to: 38px tall, rounded-md, the
          // same dark-glass border/bg/hover tokens. The height override
          // uses `data-[size=default]:h-[38px]` to match the specificity
          // of shadcn's `data-[size=default]:h-8` default — a bare
          // `h-[38px]` is one specificity step lower and gets out-ranked.
          // Explicit `dark:` variants beat shadcn's `dark:bg-input/30`
          // default that would otherwise win over `bg-white/5` on the
          // themed dark page.
          'data-[size=default]:h-[38px] shrink-0 rounded-md border-white/15 bg-white/5 px-3 text-sm text-white hover:bg-white/10 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/40 dark:bg-white/5 dark:hover:bg-white/10',
          // Recolor the embedded chevron — shadcn renders it with
          // `text-muted-foreground` which is invisible on our background.
          '[&_svg]:text-white/60',
          className,
        )}
      >
        {/* Compact trigger label: 🇦🇿 +994 */}
        <SelectValue>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden>{current.flag}</span>
            <span>+{current.dialCode}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        className={cn(FLOATING_SURFACE, 'rounded-xl border-white/10')}
      >
        {COUNTRIES.map((c) => (
          <SelectItem
            key={c.code}
            value={c.code}
            className="text-white focus:bg-white/10 focus:text-white"
          >
            <span className="inline-flex items-center gap-2">
              <span aria-hidden>{c.flag}</span>
              <span>{t(c.code)}</span>
              <span className="text-white/60">(+{c.dialCode})</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
