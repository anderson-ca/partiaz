'use client'

import { useEffect, useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { FLOATING_SURFACE } from '@/lib/ui/floating-surface'
import { cn } from '@/lib/utils'

type ResponsivePickerProps = {
  trigger: React.ReactNode
  /** Visible header text + accessible name. On mobile this becomes the
   *  Radix Dialog.Title (required for a11y); on desktop it renders as a
   *  plain `<h2>` in the popover's header. */
  title: string
  /** Optional right-aligned toolbar inside the header (e.g. shuffle dice). */
  toolbar?: React.ReactNode
  /** Tabs / grid / footer — anything below the header. */
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Popover side, desktop only. Sheet on mobile is always `bottom`. */
  side?: 'left' | 'right' | 'top' | 'bottom'
  /** Popover align, desktop only. */
  align?: 'start' | 'center' | 'end'
  /** Extra classes applied to the popover/sheet content card (e.g. width). */
  contentClassName?: string
}

const HEADER_CLASS =
  'flex flex-row items-center justify-between border-b border-white/10 px-4 py-3'
const TITLE_CLASS = 'text-base font-semibold text-white'

// Layout-only classes for the picker card. Dark-glass styling comes from
// FLOATING_SURFACE (project-wide convention — see CLAUDE.md "Floating
// surface convention").
const CARD_LAYOUT = 'flex flex-col gap-0 overflow-hidden p-0'

export function ResponsivePicker({
  trigger,
  title,
  toolbar,
  children,
  open,
  onOpenChange,
  side = 'left',
  align = 'center',
  contentClassName,
}: ResponsivePickerProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Pre-mount (server + first client paint): render the bare trigger only,
  // no Radix wrapper. The conditional Sheet-vs-Popover branching below
  // makes Radix call `useId()` differently across SSR and post-hydration
  // states, which shifts ids for *every later* Radix-wrapped component on
  // the page (ColorPicker, etc.) and triggers an `aria-controls` hydration
  // mismatch. Holding off the wrapper until mount eliminates the variance:
  // SSR and first paint are both "trigger only" — identical HTML — and the
  // wrapper attaches via a normal client-side state update after hydration.
  if (!mounted) {
    return <>{trigger}</>
  }

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          side={side}
          align={align}
          sideOffset={12}
          collisionPadding={16}
          avoidCollisions
          className={cn(
            FLOATING_SURFACE,
            CARD_LAYOUT,
            'max-h-[80vh] w-[min(360px,calc(100vw-2rem))] rounded-2xl',
            contentClassName,
          )}
        >
          <div className={HEADER_CLASS}>
            <h2 className={TITLE_CLASS}>{title}</h2>
            {toolbar}
          </div>
          {children}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="bottom"
        className={cn(
          FLOATING_SURFACE,
          CARD_LAYOUT,
          'max-h-[85vh] rounded-t-2xl',
          contentClassName,
        )}
      >
        <SheetHeader className={HEADER_CLASS}>
          <SheetTitle className={TITLE_CLASS}>{title}</SheetTitle>
          {toolbar}
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  )
}
