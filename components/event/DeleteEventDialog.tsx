'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { deleteEvent } from '@/app/actions/events'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { FLOATING_SURFACE } from '@/lib/ui/floating-surface'
import { cn } from '@/lib/utils'

type DeleteEventDialogProps = {
  eventId: string
  eventTitle: string
  locale: string
  /**
   * After a successful delete:
   * - 'revalidate' → router.refresh() (caller stays on the same route — used by
   *    the dashboard cards, where the Server Action's revalidatePath has
   *    already invalidated the cache).
   * - 'redirect'   → push to /{locale}/events (used by the editor danger zone,
   *    where the current route's row is gone).
   */
  onSuccess: 'revalidate' | 'redirect'
  /** Trigger element (rendered via asChild). */
  children: React.ReactNode
  /** Controlled open state — lets parents (e.g. a dropdown menu item) drive
   *  open from outside instead of relying on the trigger child. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DeleteEventDialog({
  eventId,
  eventTitle,
  locale,
  onSuccess,
  children,
  open,
  onOpenChange,
}: DeleteEventDialogProps) {
  const t = useTranslations('events.delete')
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteEvent(eventId)
      if (!result.ok) {
        toast.error(t('error'))
        return
      }
      toast.success(t('success'))
      if (onSuccess === 'redirect') {
        router.push(`/${locale}/events`)
      } else {
        router.refresh()
      }
      onOpenChange?.(false)
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent
        className={cn(FLOATING_SURFACE, 'rounded-2xl sm:max-w-md')}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            {t('title', { title: eventTitle })}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white/70">
            {t('body')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="border-white/20 bg-transparent text-white hover:bg-white/10"
            disabled={pending}
          >
            {t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            className="bg-rose-600 text-white hover:bg-rose-500 focus-visible:ring-rose-400/40"
            onClick={(e) => {
              e.preventDefault()
              handleConfirm()
            }}
          >
            {pending ? t('deleting') : t('confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
