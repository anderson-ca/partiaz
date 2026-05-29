import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import { cn } from '@/lib/utils'

/**
 * Button — the canonical interactive primitive for parti.az.
 *
 * Design language:
 *   • Pill (rounded-full) on every variant.
 *   • White-on-dark default — the app's surfaces are dark, so the most
 *     prominent CTA reads as a white pill, not the shadcn-stock dark pill.
 *   • 150ms transitions on transform + shadow + bg.
 *   • Filled variants (default/destructive) get a subtle hover scale-up
 *     (1.02) + shadow elevation; quieter variants shift bg only.
 *   • `active:scale-[0.98]` on every variant for tactile press feedback.
 *   • `focus-visible` (keyboard-only) violet ring; mouse clicks don't show it.
 *
 * Loading state pattern — pair with Loader2 from lucide-react and an
 * i18n key from `common.{saving,sending,deleting,loading}`:
 *
 *   <Button disabled={isPending}>
 *     {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
 *     {isPending ? t('common.saving') : t('common.save')}
 *   </Button>
 */
const buttonVariants = cva(
  cn(
    'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium select-none',
    'transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40',
    'active:scale-[0.98]',
    // Cursor + disable: HTML `disabled` already blocks onClick/focus reliably,
    // so dropping the prior `disabled:pointer-events-none` lets the
    // disabled cursor actually render (pointer-events:none would suppress
    // hover/cursor state). Idle state gets explicit cursor-pointer for
    // browser consistency (Firefox doesn't always default <button> to
    // pointer). [ux-pending-state-and-cursors]
    'cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ),
  {
    variants: {
      variant: {
        default:
          'bg-white text-zinc-900 shadow-sm hover:bg-white/95 hover:scale-[1.02] hover:shadow-md',
        destructive:
          'bg-rose-600 text-white shadow-sm hover:bg-rose-500 hover:scale-[1.02] hover:shadow-md',
        outline:
          'border border-white/20 bg-transparent text-white hover:bg-white/5 hover:border-white/30',
        secondary: 'bg-white/10 text-white hover:bg-white/15',
        ghost: 'text-white hover:bg-white/10',
        link: 'text-violet-400 underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        default: 'h-11 px-5 text-sm',
        lg: 'h-12 px-7 text-base',
        icon: 'h-10 w-10',
        // icon-sm is a tighter icon variant kept for picker/sheet close
        // affordances that pre-date this prompt — h-10/w-10 is too big in
        // those contexts. Don't reach for it for new code; prefer `icon`.
        'icon-sm': "h-7 w-7 [&_svg:not([class*='size-'])]:size-3.5",
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
