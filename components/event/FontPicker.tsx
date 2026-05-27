'use client'

import { useTranslations } from 'next-intl'
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

// UI category buckets. The DB has 6 categories (classic/eclectic/fancy/
// literary/digital/elegant); the UI collapses literary + elegant into a
// single SERIF group since both are serif families, just with different
// personalities. Fixed render order independent of alphabetical DB sort.
type UiCategory = 'sans' | 'serif' | 'display' | 'handwritten' | 'mono'

const UI_CATEGORY_ORDER: readonly UiCategory[] = [
  'sans',
  'serif',
  'display',
  'handwritten',
  'mono',
] as const

function dbCategoryToUi(db: string): UiCategory {
  switch (db) {
    case 'classic':
      return 'sans'
    case 'literary':
    case 'elegant':
      return 'serif'
    case 'fancy':
      return 'display'
    case 'eclectic':
      return 'handwritten'
    case 'digital':
      return 'mono'
    default:
      return 'sans'
  }
}

export function FontPicker({
  fontPresets,
  selectedFontPresetId,
  onSelect,
  className,
}: FontPickerProps) {
  const t = useTranslations('events.editor.fontCategories')

  // Group presets by UI bucket. Insertion preserves DB sort order
  // (category ASC, order_index ASC), so SERIF receives elegant entries
  // (Lora, Playfair Display) before literary (Cormorant Garamond, PT Serif,
  // then the new additions) — `elegant` < `literary` alphabetically and
  // existing literary order_index (10, 20) precedes the new entries (110+).
  const grouped = new Map<UiCategory, FontPresetForPicker[]>()
  for (const f of fontPresets) {
    const ui = dbCategoryToUi(f.category)
    let list = grouped.get(ui)
    if (!list) {
      list = []
      grouped.set(ui, list)
    }
    list.push(f)
  }

  return (
    // Native horizontal overflow, scrollbar hidden — wheel/touch/keyboard
    // scroll still works. Padding `py-2` gives the pills room to breathe on
    // both sides without a scrollbar kissing their bottom edge.
    <div
      className={cn(
        'w-full overflow-x-auto py-2 whitespace-nowrap',
        '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      <div className="flex w-max items-center gap-2 px-1">
        {UI_CATEGORY_ORDER.flatMap((ui) => {
          const fonts = grouped.get(ui)
          if (!fonts || fonts.length === 0) return []
          return [
            <span
              key={`marker-${ui}`}
              className="shrink-0 pr-1 pl-2 text-[10px] tracking-[0.12em] text-foreground-faint uppercase"
              aria-hidden
            >
              {t(ui)}
            </span>,
            ...fonts.map((f) => {
              const isSelected = f.id === selectedFontPresetId
              const cssVar =
                fontFamilyToCssVar[f.font_family] ?? '--font-inter'
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-label={`${f.name} font`}
                  aria-pressed={isSelected}
                  onClick={() => onSelect(f.id)}
                  className={cn(
                    'rounded-full border px-4 py-2 text-base transition',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40',
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
            }),
          ]
        })}
      </div>
    </div>
  )
}
