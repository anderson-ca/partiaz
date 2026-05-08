'use client'

import { useState } from 'react'
import type { ISourceOptions } from '@tsparticles/engine'
import { LazyEffectOverlay as EffectOverlay } from '@/components/event/LazyEffectOverlay'
import { cn } from '@/lib/utils'

type EffectRowMin = {
  id: string
  name: string
  category: string
  // The DB column is `text` with a CHECK; widened here because the generated
  // Supabase types lose the literal union. Narrowed at the call site.
  engine: string
  config: unknown
}

export function EffectsSection({ effects }: { effects: EffectRowMin[] }) {
  const [activeId, setActiveId] = useState<string | null>(null)

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {effects.map((e) => {
        const isActive = e.id === activeId
        const isNone =
          e.engine === 'css' ||
          (typeof e.config === 'object' &&
            e.config !== null &&
            Object.keys(e.config as object).length === 0)
        return (
          <button
            key={e.id}
            type="button"
            onClick={() =>
              setActiveId((prev) => (prev === e.id ? null : e.id))
            }
            className={cn(
              'relative h-32 overflow-hidden rounded-lg border bg-zinc-900 text-left text-white',
              'transition hover:ring-2 hover:ring-zinc-400',
              isActive && 'ring-2 ring-emerald-400',
            )}
          >
            {isActive && !isNone && (
              <EffectOverlay
                effect={{
                  id: e.id,
                  name: e.name,
                  engine: e.engine === 'tsparticles' ? 'tsparticles' : 'css',
                  config: e.config as ISourceOptions,
                }}
              />
            )}
            <div className="absolute inset-0 flex items-end p-2">
              <div className="text-xs leading-tight">
                <div className="font-medium">{e.name}</div>
                <div className="text-zinc-400">
                  {e.category}
                  {isActive ? ' · running' : ''}
                </div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
