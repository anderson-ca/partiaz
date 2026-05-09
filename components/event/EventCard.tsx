import Image from 'next/image'
import Link from 'next/link'
import { Crown } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { EventTitle, type FontPresetForRender } from '@/components/event/EventTitle'
import { ThemeBackground } from '@/components/event/ThemeBackground'
import { FLOATING_SURFACE } from '@/lib/ui/floating-surface'
import type { ThemeBackgroundValue } from '@/lib/schemas/theme'
import { cn } from '@/lib/utils'

export type EventCardEvent = {
  id: string
  slug: string
  title: string
  status: 'draft' | 'published' | 'canceled'
  text_color: string
  cover_image_url: string | null
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

  return (
    <Link
      href={`/${locale}/e/${event.slug}`}
      className="group relative block overflow-hidden rounded-2xl ring-1 ring-white/10 transition hover:scale-[1.02] hover:ring-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      style={{ aspectRatio: '4 / 5' }}
    >
      {/* Background layer: cover wins over theme when present, theme as
          fallback. ThemeBackground's wrapper is already absolute inset-0. */}
      {event.cover_image_url ? (
        <Image
          src={event.cover_image_url}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 384px"
          className="object-cover"
        />
      ) : (
        <ThemeBackground theme={event.theme} className="absolute inset-0" />
      )}

      {/* Bottom-up dark gradient for title legibility regardless of cover/theme */}
      <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/0 to-black/0" />

      {/* Top-left status pill */}
      <div className="absolute top-3 left-3 z-10">
        <span
          className={cn(
            FLOATING_SURFACE,
            'inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide',
            event.status === 'draft' ? 'text-white/80' : 'text-emerald-300',
          )}
        >
          {event.status === 'draft'
            ? t('cardStatusDraft')
            : t('cardStatusPublic')}
        </span>
      </div>

      {/* Top-right hosting badge */}
      {isHost && (
        <div className="absolute top-3 right-3 z-10">
          <span
            className={cn(
              FLOATING_SURFACE,
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium',
            )}
          >
            <Crown className="h-3 w-3 text-yellow-300" />
            {t('cardHostingBadge')}
          </span>
        </div>
      )}

      {/* Title at the bottom */}
      <div className="absolute right-3 bottom-3 left-3 z-10">
        <EventTitle
          as="span"
          text={event.title}
          fontPreset={event.font_preset}
          textColor={event.text_color}
          className="line-clamp-2 text-xl leading-tight md:text-2xl"
        />
      </div>
    </Link>
  )
}
