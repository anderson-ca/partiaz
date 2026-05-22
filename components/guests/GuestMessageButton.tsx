'use client'

import * as React from 'react'
import { MessageSquare } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { FLOATING_SURFACE } from '@/lib/ui/floating-surface'
import { cn } from '@/lib/utils'

type GuestMessageButtonProps = {
  message: string
  /** Optional — guest name shown as a header inside the popover so the
   *  host knows whose message they're reading (helpful in long lists). */
  guestLabel?: string
}

/**
 * Small message-icon button that reveals a guest's free-form note to the
 * host in a popover. Messages are 280-char-capped server-side ([12b]),
 * so no truncation needed in the reveal.
 *
 * Client component because Popover wants interactivity. Parent (the
 * server-rendered GuestRow) only renders this when guest_message is
 * non-empty.
 */
export function GuestMessageButton({
  message,
  guestLabel,
}: GuestMessageButtonProps) {
  const t = useTranslations('events.guests.message')
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t('reveal')}
          title={t('reveal')}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-violet-300 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40"
        >
          <MessageSquare className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className={cn(
          FLOATING_SURFACE,
          'w-72 rounded-xl border border-white/10 p-3',
        )}
      >
        {guestLabel && (
          <p className="mb-1 text-xs font-medium text-white/60">{guestLabel}</p>
        )}
        <p className="whitespace-pre-wrap break-words text-sm text-white">
          {message}
        </p>
      </PopoverContent>
    </Popover>
  )
}
