import Image from 'next/image'
import Link from 'next/link'
import { Crown, Users } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { EventTitle, type FontPresetForRender } from '@/components/event/EventTitle'
import { ThemeBackground } from '@/components/event/ThemeBackground'
import { EventCardActions } from '@/components/event/EventCardActions'
import { Pill } from '@/components/ui/pill'
import { isVideoCoverUrl } from '@/lib/cover'
import { bucketCardDate, type AppLocale } from '@/lib/dates'
import type { ThemeBackgroundValue } from '@/lib/schemas/theme'

export type EventCardEvent = {
  id: string
  slug: string
  title: string
  status: 'draft' | 'published' | 'canceled'
  text_color: string
  cover_image_url: string | null
  starts_at: string | null
  /** True when the viewer is a co-host of this event (not the primary host).
   *  Drives the bottom-left badge: "Hosting" vs "Co-hosting". */
  isCohosting?: boolean
  theme: {
    background_type: ThemeBackgroundValue['type']
    background_value: ThemeBackgroundValue
  }
  font_preset: FontPresetForRender
}

type EventCardProps = {
  event: EventCardEvent
  isHost: boolean
  locale: string
}

export async function EventCard({ event, isHost, locale }: EventCardProps) {
  const t = await getTranslations('dashboard')
  const tCohosts = await getTranslations('cohosts')
  const tRel = await getTranslations('events.dateRelative')

  // Decision per [09.84] report-back: the date pill replaces the status pill
  // in the top-left. Hosts only see these cards on their own dashboard, so
  // the Draft/Public distinction is less useful at-a-glance than "when is
  // this happening?". Drafts without a date show a muted "No date yet" pill
  // so the empty-state is still visually distinct.
  const datePill = renderDatePill({
    startsAt: event.starts_at,
    locale: locale as AppLocale,
    noDateLabel: t('cardNoDate'),
    todayLabel: tRel('today'),
    tomorrowLabel: tRel('tomorrow'),
    yesterdayLabel: tRel('yesterday'),
  })

  return (
    // Card root is a plain div now: the navigation Link is a SIBLING at z-0
    // (not a parent), so the actions menu at z-20 can receive clicks without
    // them bubbling into a navigation. Hover ring lives on the root via the
    // `group` + group-hover trick on the Link layer below.
    <div
      className="group relative overflow-hidden rounded-2xl ring-1 ring-white/10 transition hover:ring-white/30"
      style={{ aspectRatio: '4 / 5' }}
    >
      {/* Navigation layer — covers the card area but lives below decoration
          and above nothing interactive, so the menu trigger at z-20 wins. */}
      <Link
        href={`/${locale}/e/${event.slug}`}
        aria-label={event.title}
        className="absolute inset-0 z-0 rounded-2xl transition-transform duration-200 group-hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      />

      {/* Background layer: cover wins over theme when present, theme as
          fallback. Decorative — clicks pass through to the Link.
          MP4 covers (Giphy GIF picks) render as muted-loop <video>; static
          covers go through next/image. Overlay text is intentionally NOT
          rendered here — the EventTitle below already names the event, and
          stacking overlay text on top would be redundant. */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-2xl transition-transform duration-200 group-hover:scale-[1.02]">
        {event.cover_image_url ? (
          isVideoCoverUrl(event.cover_image_url) ? (
            <video
              src={event.cover_image_url}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <Image
              src={event.cover_image_url}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 384px"
              className="object-cover"
            />
          )
        ) : (
          <ThemeBackground
            theme={event.theme}
            staticOnly
            className="absolute inset-0"
          />
        )}
      </div>

      {/* Bottom-up dark gradient for title legibility */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-linear-to-t from-black/65 via-black/0 to-black/0" />

      {/* Top-left date pill */}
      <div className="pointer-events-none absolute top-3 left-3 z-10">
        <Pill variant={datePill.variant} className="text-[10px] tracking-wide">
          {datePill.label}
        </Pill>
      </div>

      {/* Top-right actions menu — only when the viewer is the host. Lives at
          z-20 so its trigger sits ABOVE the Link layer. */}
      {isHost && (
        <div className="absolute top-2 right-2 z-20">
          <EventCardActions
            eventId={event.id}
            eventTitle={event.title || t('cardStatusDraft')}
            slug={event.slug}
            locale={locale}
            isCohosting={event.isCohosting}
          />
        </div>
      )}

      {/* Bottom-left hosting badge — swaps to "Co-hosting" with a different
          icon when the viewer is a co-host (not the primary host). */}
      {isHost && (
        <div className="pointer-events-none absolute bottom-14 left-3 z-10">
          <Pill variant="info" className="text-[10px]">
            {event.isCohosting ? (
              <Users className="h-3 w-3" />
            ) : (
              <Crown className="h-3 w-3 text-yellow-300" />
            )}
            {event.isCohosting
              ? tCohosts('cardHostingBadge')
              : t('cardHostingBadge')}
          </Pill>
        </div>
      )}

      {/* Title at the bottom */}
      <div className="pointer-events-none absolute right-3 bottom-3 left-3 z-10">
        <EventTitle
          as="span"
          text={event.title}
          fontPreset={event.font_preset}
          textColor={event.text_color}
          className="line-clamp-2 text-xl leading-tight md:text-2xl"
        />
      </div>
    </div>
  )
}

// ----- Date pill rendering -------------------------------------------------

type DatePillVariant = 'default' | 'muted' | 'success' | 'info'

type RenderDatePillArgs = {
  startsAt: string | null
  locale: AppLocale
  noDateLabel: string
  todayLabel: string
  tomorrowLabel: string
  yesterdayLabel: string
}

function renderDatePill({
  startsAt,
  locale,
  noDateLabel,
  todayLabel,
  tomorrowLabel,
  yesterdayLabel,
}: RenderDatePillArgs): { label: string; variant: DatePillVariant } {
  if (!startsAt) return { label: noDateLabel, variant: 'muted' }
  const bucket = bucketCardDate(startsAt, locale)
  switch (bucket.kind) {
    case 'today':
      return { label: `${todayLabel}, ${bucket.time}`, variant: 'success' }
    case 'tomorrow':
      return { label: `${tomorrowLabel}, ${bucket.time}`, variant: 'info' }
    case 'yesterday':
      return { label: `${yesterdayLabel}, ${bucket.time}`, variant: 'muted' }
    case 'past_relative':
      return {
        label: new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
          -bucket.days,
          'day',
        ),
        variant: 'muted',
      }
    case 'absolute':
      return { label: bucket.label, variant: 'default' }
  }
}
