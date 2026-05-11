'use client'

import { memo, useEffect, useState } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
// We deliberately use loadAll instead of loadSlim. 7 of our 14 seeded effects
// depend on plugins not in slim:
//   - shape: 'char' (Hearts, Petals, Emoji rain, Balloons) → @tsparticles/shape-text
//   - destroy.split + move.gravity.inverse (Fireworks)
// loadAll costs ~50KB extra over loadSlim but eliminates per-effect plugin
// curation. If bundle size becomes a real performance issue on the public
// event page (currently 233KB First Load on /dev/themes), the surgical fix
// is loadSlim + explicit imports of the specific plugins each effect needs,
// NOT a blanket switch to loadSlim. See PRODUCT_SPEC.md §9.4.
import { loadAll } from '@tsparticles/all'
import type { ISourceOptions } from '@tsparticles/engine'
import { cn } from '@/lib/utils'

export type EffectRow = {
  id: string
  name: string
  engine: 'tsparticles' | 'css'
  config: ISourceOptions | Record<string, never>
}

type EffectOverlayProps = {
  effect: EffectRow | null
  className?: string
}

// Module-level flag — initParticlesEngine resolves once globally.
let enginePromise: Promise<void> | null = null

function ensureEngineReady(): Promise<void> {
  if (!enginePromise) {
    enginePromise = initParticlesEngine(async (engine) => {
      await loadAll(engine)
    })
  }
  return enginePromise
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

function EffectOverlayInner({ effect, className }: EffectOverlayProps) {
  const [ready, setReady] = useState(false)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    let cancelled = false
    ensureEngineReady().then(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!effect) return null
  if (effect.engine === 'css') return null
  if (Object.keys(effect.config).length === 0) return null
  if (reducedMotion) return null
  if (!ready) return null

  return (
    <Particles
      id={`effect-${effect.id}`}
      options={effect.config as ISourceOptions}
      className={cn('pointer-events-none absolute inset-0', className)}
    />
  )
}

/**
 * `React.memo` is doing real work here. `@tsparticles/react` v3.0.0 lists the
 * entire props object in its internal `useEffect` deps array
 * (`[id, props, props.url, props.options]`), so the particle engine
 * destroys + reloads on every parent re-render — restarting the animation.
 * The parent already memoizes `effect`, and `className` is a string literal,
 * so memoizing this component short-circuits the render entirely when the
 * editor re-renders for unrelated reasons (title keystrokes, cover switch).
 */
export const EffectOverlay = memo(EffectOverlayInner)
