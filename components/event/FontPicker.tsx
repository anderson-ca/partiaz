'use client'

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { fontFamilyToCssVar } from '@/lib/fonts'
import { cn } from '@/lib/utils'

export type FontPresetForPicker = {
  id: string
  name: string
  category: string
  font_family: string
  font_weight: number
  letter_spacing: string
  text_transform: string
}

type FontPickerProps = {
  fontPresets: FontPresetForPicker[]
  selectedFontPresetId: string | null
  onSelect: (fontPresetId: string) => void
  className?: string
}

export function FontPicker({
  fontPresets,
  selectedFontPresetId,
  onSelect,
  className,
}: FontPickerProps) {
  return (
    <ScrollArea className={cn('w-full whitespace-nowrap', className)}>
      <div className="flex w-max gap-2 px-1 pb-2">
        {fontPresets.map((f) => {
          const isSelected = f.id === selectedFontPresetId
          const cssVar = fontFamilyToCssVar[f.font_family] ?? '--font-inter'
          return (
            <button
              key={f.id}
              type="button"
              aria-label={`${f.name} font`}
              aria-pressed={isSelected}
              onClick={() => onSelect(f.id)}
              className={cn(
                'rounded-full border px-4 py-2 text-base transition',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background hover:bg-muted',
              )}
              style={{
                fontFamily: `var(${cssVar})`,
                fontWeight: f.font_weight,
                letterSpacing: f.letter_spacing,
                textTransform:
                  f.text_transform as React.CSSProperties['textTransform'],
              }}
            >
              {f.name}
            </button>
          )
        })}
      </div>
      <ScrollBar orientation="horizontal" className="h-1.5" />
    </ScrollArea>
  )
}
