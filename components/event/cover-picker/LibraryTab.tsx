'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Pill } from '@/components/ui/pill'
import { cn } from '@/lib/utils'

export type CoverIllustration = {
  id: string
  image_url: string
  category: string
}

const CATEGORIES = [
  'all',
  'wedding',
  'birthday',
  'ramadan',
  'christmas',
  'halloween',
] as const
type CategoryKey = (typeof CATEGORIES)[number]

type LibraryTabProps = {
  illustrations: CoverIllustration[]
  /** When the current cover came from the library, the URL of the selected
   *  illustration. Used to render the check overlay on the matching tile. */
  selectedUrl: string | null
  onSelect: (url: string) => void
}

export function LibraryTab({
  illustrations,
  selectedUrl,
  onSelect,
}: LibraryTabProps) {
  const t = useTranslations('cover.library')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryKey>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return illustrations.filter((ill) => {
      if (category !== 'all' && ill.category !== category) return false
      // Search currently runs only on the category label — illustrations
      // don't have searchable tags yet (added with the seed). Keeps the
      // filter useful even before content lands.
      if (q && !ill.category.toLowerCase().includes(q)) return false
      return true
    })
  }, [illustrations, query, category])

  return (
    <div className="flex flex-1 flex-col">
      <div className="space-y-3 px-4 pt-3 pb-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-sm text-white placeholder:text-white/40 focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
        />
        <ScrollArea className="-mx-1 w-[calc(100%+0.5rem)]">
          <div className="flex gap-2 px-1">
            {CATEGORIES.map((cat) => {
              const active = cat === category
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className="shrink-0"
                  aria-pressed={active}
                >
                  <Pill
                    variant={active ? 'default' : 'muted'}
                    className={cn(
                      'capitalize transition-colors',
                      active
                        ? 'bg-white text-zinc-900'
                        : 'hover:bg-white/10 hover:text-white',
                    )}
                  >
                    {t(
                      `category${cat.charAt(0).toUpperCase() + cat.slice(1)}` as
                        | 'categoryAll'
                        | 'categoryWedding'
                        | 'categoryBirthday'
                        | 'categoryRamadan'
                        | 'categoryChristmas'
                        | 'categoryHalloween',
                    )}
                  </Pill>
                </button>
              )
            })}
          </div>
        </ScrollArea>
      </div>

      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-white/60">
            {t('emptyState')}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3 p-4 min-[480px]:grid-cols-4">
            {filtered.map((ill) => {
              const isSelected = selectedUrl === ill.image_url
              return (
                <button
                  key={ill.id}
                  type="button"
                  aria-label={ill.category}
                  aria-pressed={isSelected}
                  onClick={() => onSelect(ill.image_url)}
                  className={cn(
                    'relative aspect-square overflow-hidden rounded-xl border border-white/10',
                    'transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]',
                    isSelected &&
                      'ring-2 ring-white ring-offset-2 ring-offset-zinc-900',
                  )}
                >
                  <Image
                    src={ill.image_url}
                    alt=""
                    fill
                    sizes="(max-width: 480px) 33vw, 200px"
                    className="object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <span className="rounded-full bg-white/90 p-1 text-zinc-900">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
