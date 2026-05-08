'use client'

import { useState } from 'react'
import { HexColorInput, HexColorPicker } from 'react-colorful'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const PRESET_SWATCHES = [
  '#ffffff',
  '#000000',
  '#fafafa',
  '#1a1a2e',
  '#ff6b9d',
  '#f59e0b',
  '#5b8def',
  '#10b981',
] as const

type ColorPickerProps = {
  value: string
  onChange: (hex: string) => void
  trigger: React.ReactNode
  /** Optional className for the popover content. */
  contentClassName?: string
}

export function ColorPicker({
  value,
  onChange,
  trigger,
  contentClassName,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className={cn('w-auto space-y-3 p-3', contentClassName)}
      >
        <HexColorPicker color={value} onChange={onChange} />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Hex</span>
          <HexColorInput
            color={value}
            onChange={onChange}
            prefixed
            className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_SWATCHES.map((hex) => (
            <button
              key={hex}
              type="button"
              aria-label={`Set color to ${hex}`}
              onClick={() => onChange(hex)}
              className={cn(
                'h-6 w-6 rounded-full border shadow-sm',
                value.toLowerCase() === hex.toLowerCase() &&
                  'ring-2 ring-foreground ring-offset-2',
              )}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
