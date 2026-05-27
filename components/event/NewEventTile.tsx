import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

type NewEventTileProps = {
  locale: string
}

// Always-last tile in non-empty grids. Same 4:5 aspect as EventCard so the
// grid stays uniform — distinguished from event tiles (which carry per-event
// covers + themes) by a brand-colored translucent surface treatment that
// reads as the "create affordance." Apple-Invites-style aspirational CTA.
export async function NewEventTile({ locale }: NewEventTileProps) {
  const t = await getTranslations('dashboard')
  return (
    <Link
      href={`/${locale}/events/new`}
      className="group relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-brand-400/30 bg-brand-500/15 backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:border-brand-400/50 hover:bg-brand-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40"
      style={{ aspectRatio: '4 / 5' }}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/30 text-brand-100 transition group-hover:bg-brand-500/40">
        <Plus className="h-7 w-7" />
      </span>
      <span className="text-base font-medium text-white">
        {t('newEventTile')}
      </span>
    </Link>
  )
}
