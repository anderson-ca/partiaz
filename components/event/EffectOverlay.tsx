'use client'

import { useEffect, useState } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
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

export function EffectOverlay({ effect, className }: EffectOverlayProps) {
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
