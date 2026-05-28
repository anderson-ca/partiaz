'use client'

import { useMemo, useState } from 'react'
import { Check, Dices } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EffectThumbnail } from '@/components/event/EffectThumbnail'
import { ResponsivePicker } from '@/components/event/ResponsivePicker'
import { cn } from '@/lib/utils'

export type EffectRowMin = {
  id: string
  name: string
  category: string
  engine: string
  config: unknown
}

type EffectPickerProps = {
  effects: EffectRowMin[]
  selectedEffectId: string | null
  onSelectEffect: (effectId: string | null) => void
  onShuffle?: () => void
  trigger: React.ReactNode
}

export function EffectPicker({
  effects,
  selectedEffectId,
  onSelectEffect,
  onShuffle,
  trigger,
}: EffectPickerProps) {
  const [open, setOpen] = useState(false)

  // "None" is pinned at the top so users can always clear the effect.
  const noneEffect = useMemo(
    () => effects.find((e) => e.name === 'None') ?? null,
    [effects],
  )
  const nonNone = useMemo(
    () => effects.filter((e) => e.name !== 'None'),
    [effects],
  )

  function handlePick(effectId: string | null) {
    onSelectEffect(effectId)
    setOpen(false)
  }

  function handleShuffle() {
    if (nonNone.length === 0) return
    const random = nonNone[Math.floor(Math.random() * nonNone.length)]
    if (onShuffle) onShuffle()
    onSelectEffect(random.id)
    setOpen(false)
  }

  return (
    <ResponsivePicker
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      title="Effect"
      side="left"
      toolbar={
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Shuffle"
          onClick={handleShuffle}
          className="text-white hover:bg-white/10"
        >
          <Dices />
        </Button>
      }
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="grid grid-cols-3 gap-3 p-4 min-[380px]:grid-cols-4">
          {noneEffect && (
            <EffectCircle
              name={noneEffect.name}
              label="None"
              isSelected={selectedEffectId === noneEffect.id}
              onClick={() => handlePick(noneEffect.id)}
            />
          )}

          {nonNone.map((effect) => (
            <EffectCircle
              key={effect.id}
              name={effect.name}
              label={effect.name}
              isSelected={selectedEffectId === effect.id}
              onClick={() => handlePick(effect.id)}
            />
          ))}
        </div>
      </div>
    </ResponsivePicker>
  )
}

function EffectCircle({
  name,
  label,
  isSelected,
  onClick,
}: {
  name: string
  label: string
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isSelected}
      onClick={onClick}
      className="group flex flex-col items-center gap-1.5"
    >
      <div
        className={cn(
          'relative aspect-square w-full overflow-hidden rounded-full border border-white/10',
          'transition group-hover:scale-105',
          isSelected && 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900',
        )}
      >
        <EffectThumbnail name={name} className="rounded-none" />
        {isSelected && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30">
            <span className="rounded-full bg-white/90 p-1 text-zinc-900">
              <Check className="h-3.5 w-3.5" />
            </span>
          </div>
        )}
      </div>
      <span className="line-clamp-1 text-[10px] text-white/70">{label}</span>
    </button>
  )
}
