'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Pill } from '@/components/ui/pill'
import { resizeCoverUrl } from '@/lib/cover-url'
import { cn } from '@/lib/utils'

// Hides the WebKit/Firefox scrollbar while keeping native scroll behaviour.
// The right-edge mask hints at horizontal scrollability without a visible bar.
const HSCROLL_INVISIBLE =
  'overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ' +
  '[mask-image:linear-gradient(to_right,black_calc(100%-1.5rem),transparent)]'

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

  // [perf-audit] dev-only timestamps. console.timeStamp lands in the
  // DevTools Performance recording timeline so we can correlate first
  // paint, mount, and all-thumbs-loaded against image network waterfalls.
  // Strip these (and the loadedCount ref) after the optimization round.
  const loadedCountRef = useRef(0)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.timeStamp('cover-library-mounted')
    }
  }, [])

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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 space-y-3 px-4 pt-3 pb-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-sm text-white placeholder:text-white/40 focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
        />
        {/* Negative margins + matching padding let the chip row span the
            picker's full width and scroll edge-to-edge without the right-
            most chip getting clipped by the parent's px-4 padding. */}
        <div className={cn('-mx-4 px-4', HSCROLL_INVISIBLE)}>
          <div className="flex gap-2">
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
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
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
                    src={resizeCoverUrl(ill.image_url, 'grid')}
                    alt=""
                    fill
                    sizes="(max-width: 480px) 33vw, 200px"
                    className="object-cover"
                    onLoad={() => {
                      if (process.env.NODE_ENV !== 'development') return
                      loadedCountRef.current += 1
                      if (loadedCountRef.current === filtered.length) {
                        console.timeStamp('cover-library-all-loaded')
                      }
                    }}
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
      </div>
    </div>
  )
}
