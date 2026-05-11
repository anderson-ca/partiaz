'use client'

import * as React from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { az, enUS, ru } from 'react-day-picker/locale'
import type { Locale as DayPickerLocale } from 'react-day-picker'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { FLOATING_SURFACE } from '@/lib/ui/floating-surface'
import { formatLongDate, type AppLocale } from '@/lib/dates'
import { cn } from '@/lib/utils'

const DAY_PICKER_LOCALE: Record<AppLocale, DayPickerLocale> = {
  az,
  ru,
  en: enUS,
}

type DateTimePickerProps = {
  value: Date | null
  onChange: (next: Date | null) => void
  /** Optional minimum — used by the End picker to forbid times <= start. */
  minDate?: Date | null
  /** Identifies which slot in form i18n strings to use. */
  variant?: 'start' | 'end'
  locale: AppLocale
  disabled?: boolean
  /** Accessible label string for screen readers when no date is set. */
  ariaLabel?: string
}

/** Format `HH:MM` for the `<input type="time">` value. Time-only string keeps
 *  the input controlled cleanly across re-renders. */
function timeOfDay(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

/**
 * Combines a calendar date (Date with arbitrary time-of-day) with a "HH:MM"
 * string into a single Date in the viewer's local timezone. The local clock
 * is the right reference for "I picked 7 PM" — the server stores it as
 * timestamptz so a viewer in another zone sees their own offset.
 */
function withTimeOfDay(date: Date, time: string): Date {
  const [hh, mm] = time.split(':').map(Number)
  const out = new Date(date)
  out.setHours(hh ?? 19, mm ?? 0, 0, 0)
  return out
}

export function DateTimePicker({
  value,
  onChange,
  minDate,
  variant = 'start',
  locale,
  disabled,
  ariaLabel,
}: DateTimePickerProps) {
  const t = useTranslations('events.fields')
  const [open, setOpen] = React.useState(false)
  const time = value ? timeOfDay(value) : '19:00'

  function handleDate(date: Date | undefined) {
    if (!date) {
      onChange(null)
      return
    }
    onChange(withTimeOfDay(date, time))
    // Don't auto-close — user may still want to change time.
  }

  function handleTime(next: string) {
    if (!value) {
      // Setting time without a date — anchor to today.
      onChange(withTimeOfDay(new Date(), next))
      return
    }
    onChange(withTimeOfDay(value, next))
  }

  function handleClear() {
    onChange(null)
    setOpen(false)
  }

  const label = value
    ? formatLongDate(value, locale)
    : t('datePickerPlaceholder')

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={ariaLabel}
          data-slot="datetime-trigger"
          data-variant={variant}
          className={cn(
            'flex w-full items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-left text-sm transition-colors',
            'hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40 disabled:opacity-50',
            value ? 'text-white' : 'text-white/40',
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-white/60" />
          <span className="truncate">{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        // Fixed width so the popover doesn't reflow when the inline "Done"
        // button appears/disappears. 18rem ≈ the natural calendar width.
        className={cn(
          FLOATING_SURFACE,
          'w-72 rounded-2xl p-0 text-white',
        )}
      >
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={handleDate}
          locale={DAY_PICKER_LOCALE[locale]}
          disabled={minDate ? { before: minDate } : undefined}
          captionLayout="dropdown"
          className="w-full bg-transparent text-white"
          classNames={{
            // Override the shadcn-default cell styling for dark surfaces:
            // the default `bg-primary` selected state resolves to a muted
            // gray on our config and doesn't pop. Violet matches the rest of
            // the app's focus-ring + draft-banner CTA accent.
            day_button:
              'data-[selected-single=true]:bg-violet-500 data-[selected-single=true]:text-white hover:bg-white/10 hover:text-white',
            today:
              'rounded-md ring-1 ring-violet-400/40 data-[selected=true]:ring-0',
            weekday: 'text-white/50',
            caption_label: 'text-white',
            outside: 'text-white/30',
            disabled: 'text-white/20 opacity-50',
          }}
        />
        <div className="border-t border-white/10 px-3 py-2.5">
          {/* Time row — sits above the action row so the calendar + time +
              actions stack vertically and the popover width stays stable
              regardless of which buttons are visible. */}
          <label className="flex items-center justify-between gap-2 text-xs text-white/70">
            <span>{t('timeLabel')}</span>
            <input
              type="time"
              value={time}
              onChange={(e) => handleTime(e.target.value)}
              className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-sm text-white outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/40 [color-scheme:dark]"
            />
          </label>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            {value ? (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-white/60 transition-colors hover:text-rose-300"
              >
                {variant === 'end' ? t('removeEndTime') : t('clearDate')}
              </button>
            ) : (
              <span />
            )}
            <Button
              type="button"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={!value}
            >
              {t('done')}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
