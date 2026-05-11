'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  searchGiphy,
  type GiphyError,
  type GiphyResult,
} from '@/app/actions/giphy'
import { cn } from '@/lib/utils'

const DEBOUNCE_MS = 300

type GifsTabProps = {
  /** Called with the MP4 URL of the selected GIF. Source is always 'gif'. */
  onSelect: (mp4Url: string) => void
}

export function GifsTab({ onSelect }: GifsTabProps) {
  const t = useTranslations('cover.gifs')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GiphyResult[]>([])
  const [error, setError] = useState<GiphyError | null>(null)
  const [pending, startTransition] = useTransition()

  // We keep the debounce timer in a ref so re-renders don't reset it. A
  // bumping `requestId` makes sure stale fetches that resolve out-of-order
  // never overwrite a newer result set.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = useRef(0)

  function runSearch(q: string) {
    const id = ++requestIdRef.current
    setError(null)
    startTransition(async () => {
      const result = await searchGiphy(q)
      // Drop late responses if the user has typed since we kicked off.
      if (id !== requestIdRef.current) return
      if (!result.ok) {
        setError(result.error)
        setResults([])
      } else {
        setResults(result.results)
      }
    })
  }

  // Initial load: trending feed. We deliberately want this to fire once on
  // mount only; runSearch closes over current setters but its identity
  // doesn't matter here.
  useEffect(() => {
    runSearch('')
  }, [])

  function handleQueryChange(next: string) {
    setQuery(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(next), DEBOUNCE_MS)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <input
          type="search"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="flex-1 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-sm text-white placeholder:text-white/40 focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
        />
        {/* TOS-required attribution. Lives in the GIFs tab content area
            (Giphy's brand kit accepts text + monogram in this format). */}
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-white/50">
          {t('poweredBy')}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {error === 'no_api_key' ? (
          <p className="px-6 py-12 text-center text-sm text-amber-300">
            {t('noApiKey')}
          </p>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12">
            <p className="text-center text-sm text-rose-300">{t('error')}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => runSearch(query)}
            >
              {t('retry')}
            </Button>
          </div>
        ) : pending && results.length === 0 ? (
          <SkeletonGrid />
        ) : results.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-white/60">
            {t('empty', { query })}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3 p-4 min-[480px]:grid-cols-4">
            {results.map((g) => (
              <button
                key={g.id}
                type="button"
                aria-label={g.title}
                onClick={() => onSelect(g.mp4_url)}
                className={cn(
                  'relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/40',
                  'transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]',
                )}
              >
                {/* GIF preview — animated thumbnail so the user sees motion
                    before committing. We store the .mp4 instead of the .gif
                    on selection (smaller, more efficient at runtime). */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={g.preview_gif_url}
                  alt={g.title}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
            {pending && (
              <div className="col-span-full flex justify-center py-3 text-white/60">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-3 gap-3 p-4 min-[480px]:grid-cols-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square animate-pulse rounded-xl bg-white/5"
        />
      ))}
    </div>
  )
}
