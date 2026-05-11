'use client'

import * as React from 'react'
import Link from 'next/link'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DeleteEventDialog } from '@/components/event/DeleteEventDialog'
import { FLOATING_SURFACE } from '@/lib/ui/floating-surface'
import { cn } from '@/lib/utils'

type EventCardActionsProps = {
  eventId: string
  eventTitle: string
  slug: string
  locale: string
  /** True when the viewer is a co-host (not the primary host). Co-hosts can
   *  edit but cannot delete — DB-side RLS would refuse the delete anyway,
   *  but hiding the menu item up front gives cleaner UX. */
  isCohosting?: boolean
}

export function EventCardActions({
  eventId,
  eventTitle,
  slug,
  locale,
  isCohosting = false,
}: EventCardActionsProps) {
  const t = useTranslations('dashboard.cardActions')
  // Dialog open state lives outside the DropdownMenu so that closing the menu
  // (which happens on item select) doesn't unmount the AlertDialog mid-open.
  // The Radix-recommended pattern.
  const [dialogOpen, setDialogOpen] = React.useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t('menuLabel')}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/90 ring-1 ring-white/15 backdrop-blur-md transition-all duration-150 hover:bg-black/60 hover:text-white active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={6}
          className={cn(FLOATING_SURFACE, 'min-w-40 rounded-xl p-1')}
        >
          <DropdownMenuItem
            asChild
            className="text-white focus:bg-white/10 focus:text-white"
          >
            <Link href={`/${locale}/events/${slug}/edit`} className="gap-2">
              <Pencil className="h-4 w-4" />
              {t('edit')}
            </Link>
          </DropdownMenuItem>
          {!isCohosting && (
            <DropdownMenuItem
              variant="destructive"
              className="gap-2 text-rose-300 focus:bg-rose-500/15 focus:text-rose-200"
              onSelect={(e) => {
                e.preventDefault()
                setDialogOpen(true)
              }}
            >
              <Trash2 className="h-4 w-4" />
              {t('delete')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteEventDialog
        eventId={eventId}
        eventTitle={eventTitle}
        locale={locale}
        onSuccess="revalidate"
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      >
        {/* Hidden trigger — the menu item drives `open` directly, but
            AlertDialogTrigger still expects a child to wire refs to. */}
        <span className="hidden" aria-hidden />
      </DeleteEventDialog>
    </>
  )
}
