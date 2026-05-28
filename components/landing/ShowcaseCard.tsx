import { Calendar } from 'lucide-react'
import { EventTitle, type FontPresetForRender } from '@/components/event/EventTitle'
import { ThemeBackground } from '@/components/event/ThemeBackground'
import { formatLongDate, type AppLocale } from '@/lib/dates'
import type { ThemeBackgroundValue } from '@/lib/schemas/theme'

export type ShowcaseTheme = {
  background_type: ThemeBackgroundValue['type']
  background_value: ThemeBackgroundValue
}

type ShowcaseCardProps = {
  theme: ShowcaseTheme
  fontPreset: FontPresetForRender
  textColor: string
  title: string
  date: Date
  dateLocale: AppLocale
}

/**
 * Landing-specific "event page hero" composition. NOT the dashboard
 * EventCard (wrong proportions + dashboard chrome). This is what the
 * public event page hero would look like rendered at gallery scale.
 *
 * Uses the actual production components — ThemeBackground for the
 * theme-aware background, EventTitle with a real font preset — so what
 * a visitor sees on the landing is byte-identical (modulo size) to
 * what they get when they make their own event. Proof, not screenshots.
 *
 * Fixed aspect-[4/5] container so the four cards in the showcase row
 * read as a gallery row of consistent tiles.
 */
export function ShowcaseCard({
  theme,
  fontPreset,
  textColor,
  title,
  date,
  dateLocale,
}: ShowcaseCardProps) {
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-border-faint">
      <ThemeBackground theme={theme} />
      <div className="relative z-10 flex h-full flex-col justify-between p-6 md:p-7">
        <EventTitle
          as="h3"
          text={title}
          fontPreset={fontPreset}
          textColor={textColor}
          className="line-clamp-3 text-2xl leading-tight tracking-tight md:text-3xl"
        />
        <div
          className="flex items-center gap-2 text-xs font-medium opacity-80 md:text-sm"
          style={{ color: textColor }}
        >
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>{formatLongDate(date, dateLocale)}</span>
        </div>
      </div>
    </div>
  )
}
