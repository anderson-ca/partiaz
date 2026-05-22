import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/**
 * Pill — non-interactive label (status, badge, count, tag).
 *
 * Pills are quiet: no hover state, no transitions, no scale. If a label is
 * clickable, use Button (variant="secondary" or "ghost") instead — the visual
 * difference is the cue to the user that one's a label and the other is an
 * action.
 */
const pillVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-white/10 text-white',
        success: 'bg-emerald-500/15 text-emerald-300',
        warning: 'bg-amber-500/15 text-amber-300',
        info: 'bg-violet-500/15 text-violet-300',
        muted: 'bg-white/5 text-white/60',
        destructive: 'bg-rose-500/15 text-rose-300',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export type PillProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof pillVariants>

export function Pill({ className, variant, ...props }: PillProps) {
  return (
    <span
      data-slot="pill"
      data-variant={variant ?? 'default'}
      className={cn(pillVariants({ variant }), className)}
      {...props}
    />
  )
}

export { pillVariants }
