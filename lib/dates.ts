import { isSameDay, differenceInCalendarDays } from 'date-fns'

export type AppLocale = 'az' | 'ru' | 'en'

// `Intl.DateTimeFormat` picks up `az` directly in Node 22 + modern browsers.
// We pass the locale string straight through.

function toDate(value: string | Date): Date {
  return typeof value === 'string' ? new Date(value) : value
}

/**
 * Long form for the public event page header — "Sat, May 24, 7:00 PM" etc.
 * Renders in the *viewer's* local timezone (browser TZ, server TZ when SSR).
 * Timezone-aware display is its own future prompt (see CLAUDE.md).
 */
export function formatLongDate(value: string | Date, locale: AppLocale): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(toDate(value))
}

/** "May 24" / "24 мая" / "24 May" — used on the date pill when the event is
 *  more than a week out. */
function formatDayMonth(value: Date, locale: AppLocale): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(value)
}

/** "7:00 PM" / "19:00" depending on locale. */
function formatTime(value: Date, locale: AppLocale): string {
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(value)
}

/**
 * Compact label for the dashboard EventCard pill. Returns *just* the label
 * strings; the caller composes them with the i18n relative-day words
 * ("Today", "Tomorrow", "Yesterday") because those vary per locale and the
 * caller has the next-intl translator at hand.
 *
 * Decision tree:
 *   • today      → 'today'     (caller renders `${t('today')}, 7:00 PM`)
 *   • tomorrow   → 'tomorrow'
 *   • yesterday  → 'yesterday'
 *   • past <30d  → 'past_relative' with `days` (caller: "5 days ago")
 *   • future <7d → 'future_weekday' (caller renders just the weekday + time)
 *   • else       → 'absolute' (caller renders weekday + month + day)
 */
export type CardDateBucket =
  | { kind: 'today'; time: string }
  | { kind: 'tomorrow'; time: string }
  | { kind: 'yesterday'; time: string }
  | { kind: 'past_relative'; days: number }
  | { kind: 'absolute'; label: string }

export function bucketCardDate(
  value: string | Date,
  locale: AppLocale,
  now: Date = new Date(),
): CardDateBucket {
  const d = toDate(value)
  if (isSameDay(d, now)) return { kind: 'today', time: formatTime(d, locale) }

  const diff = differenceInCalendarDays(d, now)
  if (diff === 1) return { kind: 'tomorrow', time: formatTime(d, locale) }
  if (diff === -1) return { kind: 'yesterday', time: formatTime(d, locale) }

  // Past, but within a month — use a short "N days ago" relative phrase.
  // Anything older falls through to absolute "Sat, May 24" formatting; the
  // distinction beyond a month isn't useful on a dashboard pill.
  if (diff < 0 && diff > -30) return { kind: 'past_relative', days: -diff }

  return { kind: 'absolute', label: formatDayMonth(d, locale) }
}
