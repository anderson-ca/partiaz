'use client'

import { useMemo, useState } from 'react'
import { Check, Dices, Pipette } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ThemeBackground } from '@/components/event/ThemeBackground'
import { ColorPicker } from '@/components/event/ColorPicker'
import { ResponsivePicker } from '@/components/event/ResponsivePicker'
import { cn } from '@/lib/utils'
import type { ThemeRow } from '@/lib/schemas/theme'

const CATEGORIES = ['all', 'dark', 'light', 'trending', 'fun', 'seasonal'] as const
type Category = (typeof CATEGORIES)[number]

type ThemePickerProps = {
  themes: ThemeRow[]
  selectedThemeId: string | null
  selectedColorOverride: string | null
  onSelectTheme: (themeId: string) => void
  onSelectColor: (hex: string) => void
  onShuffle?: () => void
  trigger: React.ReactNode
}

export function ThemePicker({
  themes,
  selectedThemeId,
  selectedColorOverride,
  onSelectTheme,
  onSelectColor,
  onShuffle,
  trigger,
}: ThemePickerProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Category>('all')

  const filtered = useMemo(() => {
    if (activeTab === 'all') return themes
    return themes.filter((t) => t.category === activeTab)
  }, [themes, activeTab])

  function handlePickTheme(themeId: string) {
    onSelectTheme(themeId)
    setOpen(false)
  }

  function handleShuffle() {
    if (filtered.length === 0) return
    const random = filtered[Math.floor(Math.random() * filtered.length)]
    if (onShuffle) onShuffle()
    onSelectTheme(random.id)
    setOpen(false)
  }

  return (
    <ResponsivePicker
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      title="Theme"
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
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as Category)}
        className="border-b border-white/10"
      >
        <ScrollArea className="w-full">
          <TabsList className="flex w-max min-w-full justify-start gap-1 bg-transparent px-3 py-2">
            {CATEGORIES.map((cat) => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="rounded-full border-0 px-3 py-1 text-sm capitalize text-white/60 transition-all duration-150 hover:bg-white/5 hover:text-white data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-none"
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
          {/* Custom-color eyedropper — only shown in 'all' tab */}
          {activeTab === 'all' && (
            <ColorPicker
              value={selectedColorOverride ?? '#ffffff'}
              onChange={onSelectColor}
              trigger={
                <button
                  type="button"
                  aria-label="Pick custom color"
                  className={cn(
                    'relative aspect-square overflow-hidden rounded-full border-2 border-dashed border-white/40',
                    'flex items-center justify-center',
                    'transition hover:border-white/70',
                    selectedColorOverride && 'border-solid ring-2 ring-white',
                  )}
                  style={
                    selectedColorOverride
                      ? { backgroundColor: selectedColorOverride }
                      : undefined
                  }
                >
                  <Pipette
                    className={cn(
                      'h-5 w-5',
                      selectedColorOverride
                        ? 'text-white mix-blend-difference'
                        : 'text-white/70',
                    )}
                  />
                </button>
              }
            />
          )}

          {filtered.map((theme) => {
            const isSelected = theme.id === selectedThemeId
            return (
              <button
                key={theme.id}
                type="button"
                aria-label={theme.name}
                aria-pressed={isSelected}
                onClick={() => handlePickTheme(theme.id)}
                className={cn(
                  'relative aspect-square overflow-hidden rounded-full border border-white/10',
                  'transition hover:scale-105',
                  isSelected && 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900',
                )}
              >
                <ThemeBackground theme={theme} staticOnly />
                {isSelected && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <span className="rounded-full bg-white/90 p-1 text-zinc-900">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </ResponsivePicker>
  )
}
