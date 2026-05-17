'use client'

import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type StepperRowProps = {
  label: string
  value: number
  onChange: (next: number) => void
  /** Hard floor. Defaults to 0. */
  min?: number
  /** Hard ceiling. Both the +/− buttons disable at the bounds and
   *  `onChange` clamps before firing, so callers can't push past these. */
  max: number
  /** Renders the row dimmed + inert (e.g. parent toggle off). Underlying
   *  `value` is preserved in form state so toggling back on restores it. */
  disabled?: boolean
}

/**
 * Compact horizontal stepper row. Label on the left, −/value/+ controls on
 * the right. Extracted from [12a] EventSettingsPanel for reuse by [12b]
 * RsvpDialog (plus-one adult/child counts). Same visual + same clamp
 * semantics so the host's settings panel and the guest's submission UI
 * feel identical.
 */
export function StepperRow({
  label,
  value,
  onChange,
  min = 0,
  max,
  disabled = false,
}: StepperRowProps) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n))
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-lg px-1 py-1 transition-opacity',
        disabled && 'pointer-events-none opacity-40',
      )}
    >
      <div className="min-w-0 flex-1 text-sm font-medium text-white">
        {label}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(clamp(value - 1))}
          disabled={disabled || value <= min}
          aria-label={`${label} −`}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-6 text-center text-sm font-medium tabular-nums text-white">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(clamp(value + 1))}
          disabled={disabled || value >= max}
          aria-label={`${label} +`}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
