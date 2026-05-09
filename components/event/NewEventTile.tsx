import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

type NewEventTileProps = {
  locale: string
}

// Always-last tile in non-empty grids. Same 4:5 aspect as EventCard so the
// grid stays uniform.
export async function NewEventTile({ locale }: NewEventTileProps) {
  const t = await getTranslations('dashboard')
  return (
    <Link
      href={`/${locale}/events/new`}
      className="group flex flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-white/25 bg-white/5 backdrop-blur-sm transition hover:border-white/40 hover:bg-white/10 focus-visible:outline-none focus-visible:border-white/50"
      style={{ aspectRatio: '4 / 5' }}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition group-hover:bg-white/20">
        <Plus className="h-6 w-6" />
      </span>
      <span className="text-sm font-medium text-white/80">
        {t('newEventTile')}
      </span>
    </Link>
  )
}
