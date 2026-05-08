'use client'

import { useMemo, useState } from 'react'
import { Check, Dices, Pipette } from 'lucide-react'
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
import { ThemeBackground } from '@/components/event/ThemeBackground'
import { ColorPicker } from '@/components/event/ColorPicker'
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="flex-row items-center justify-between border-b p-4">
          <SheetTitle>Theme</SheetTitle>
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
                      'relative aspect-square overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/40',
                      'flex items-center justify-center',
                      'transition hover:border-muted-foreground',
                      selectedColorOverride && 'border-solid ring-2 ring-foreground',
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
                          : 'text-muted-foreground',
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
                    'relative aspect-square overflow-hidden rounded-full border',
                    'transition hover:scale-105',
                    isSelected && 'ring-2 ring-foreground ring-offset-2',
                  )}
                >
                  <ThemeBackground theme={theme} />
                  {isSelected && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                      <span className="rounded-full bg-foreground/80 p-1 text-background">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
