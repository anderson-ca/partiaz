'use client'

import * as React from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { deleteGuest } from '@/app/actions/guests'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { FLOATING_SURFACE } from '@/lib/ui/floating-surface'
import { cn } from '@/lib/utils'

type DeleteGuestButtonProps = {
  eventId: string
  guestId: string
  guestLabel: string
}

export function DeleteGuestButton({
  eventId,
  guestId,
  guestLabel,
}: DeleteGuestButtonProps) {
  const t = useTranslations('events.guests')
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteGuest(eventId, guestId)
      if (!result.ok) {
        toast.error(t(`errors.${result.error}`))
        return
      }
      toast.success(t('deleteSuccess'))
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label={t('deleteAria', { name: guestLabel })}
        className="h-8 w-8 p-0 text-white/50 hover:bg-white/10 hover:text-white"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <AlertDialogContent
        className={cn(FLOATING_SURFACE, 'rounded-2xl sm:max-w-md')}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            {t('deleteConfirmTitle', { name: guestLabel })}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white/70">
            {t('deleteConfirmBody')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline" disabled={pending}>
            {t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={(e) => {
              e.preventDefault()
              handleConfirm()
            }}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('deleteConfirmAction')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
