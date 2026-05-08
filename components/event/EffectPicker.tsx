'use client'

import { useMemo, useState } from 'react'
import { Check, Dices } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const CATEGORIES = ['all', 'fun', 'classic', 'trending', 'seasonal'] as const
type Category = (typeof CATEGORIES)[number]

// Static representative thumbnails (TODO: animated previews in P1).
// Keys match the `name` column of `public.effects`.
const EFFECT_THUMBNAILS: Record<string, string> = {
  None: '🚫',
  Confetti: '🎉',
  Snow: '❄️',
  Hearts: '💖',
  Stars: '🌟',
  Fireworks: '🎆',
  Bubbles: '🫧',
  Sparkles: '✨',
  'Emoji rain': '🎊',
  Petals: '🌸',
  Rain: '🌧️',
  Embers: '🔥',
  Balloons: '🎈',
  Lights: '🪔',
  'Snow heavy': '🌨️',
}

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
  const [activeTab, setActiveTab] = useState<Category>('all')

  // Separate "None" from the rest — it's pinned and always visible.
  const noneEffect = useMemo(
    () => effects.find((e) => e.name === 'None') ?? null,
    [effects],
  )
  const nonNone = useMemo(
    () => effects.filter((e) => e.name !== 'None'),
    [effects],
  )

  const filtered = useMemo(() => {
    if (activeTab === 'all') return nonNone
    return nonNone.filter((e) => e.category === activeTab)
  }, [nonNone, activeTab])

  function handlePick(effectId: string | null) {
    onSelectEffect(effectId)
    setOpen(false)
  }

  function handleShuffle() {
    if (filtered.length === 0) return
    const random = filtered[Math.floor(Math.random() * filtered.length)]
    if (onShuffle) onShuffle()
    onSelectEffect(random.id)
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="flex-row items-center justify-between border-b p-4">
          <SheetTitle>Effect</SheetTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Shuffle"
            onClick={handleShuffle}
          >
            <Dices />
          </Button>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as Category)}
          className="border-b"
        >
          <ScrollArea className="w-full">
            <TabsList className="flex w-max min-w-full justify-start gap-1 bg-transparent px-4 py-2">
              {CATEGORIES.map((cat) => (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="capitalize"
                >
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" className="h-1.5" />
          </ScrollArea>
        </Tabs>

        <ScrollArea className="flex-1">
          <div className="grid grid-cols-3 gap-3 p-4 min-[380px]:grid-cols-4">
            {/* Pinned None button */}
            {noneEffect && (
              <EffectCircle
                emoji={EFFECT_THUMBNAILS.None ?? '🚫'}
                label="None"
                isSelected={selectedEffectId === noneEffect.id}
                onClick={() => handlePick(noneEffect.id)}
                tone="muted"
              />
            )}

            {filtered.map((effect) => (
              <EffectCircle
                key={effect.id}
                emoji={EFFECT_THUMBNAILS[effect.name] ?? '✨'}
                label={effect.name}
                isSelected={selectedEffectId === effect.id}
                onClick={() => handlePick(effect.id)}
              />
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

function EffectCircle({
  emoji,
  label,
  isSelected,
  onClick,
  tone = 'default',
}: {
  emoji: string
  label: string
  isSelected: boolean
  onClick: () => void
  tone?: 'default' | 'muted'
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isSelected}
      onClick={onClick}
      className={cn(
        'group flex flex-col items-center gap-1.5',
      )}
    >
      <div
        className={cn(
          'relative aspect-square w-full overflow-hidden rounded-full border',
          'flex items-center justify-center text-2xl',
          'transition group-hover:scale-105',
          tone === 'muted'
            ? 'bg-muted'
            : 'bg-gradient-to-br from-zinc-800 to-zinc-900 text-white',
          isSelected && 'ring-2 ring-foreground ring-offset-2',
        )}
      >
        <span aria-hidden>{emoji}</span>
        {isSelected && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30">
            <span className="rounded-full bg-foreground/80 p-1 text-background">
              <Check className="h-3.5 w-3.5" />
            </span>
          </div>
        )}
      </div>
      <span className="line-clamp-1 text-[10px] text-muted-foreground">
        {label}
      </span>
    </button>
  )
}
