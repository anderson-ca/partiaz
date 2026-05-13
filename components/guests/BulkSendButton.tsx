'use client'

import * as React from 'react'
import { Loader2, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { sendInvites } from '@/app/actions/guests'
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
import { Button } from '@/components/ui/button'
import { FLOATING_SURFACE } from '@/lib/ui/floating-surface'
import { cn } from '@/lib/utils'

type BulkSendButtonProps = {
  eventId: string
  unsentGuestIds: string[]
}

export function BulkSendButton({
  eventId,
  unsentGuestIds,
}: BulkSendButtonProps) {
  const t = useTranslations('events.guests.send')
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const count = unsentGuestIds.length

  function handleConfirm() {
    startTransition(async () => {
      const result = await sendInvites(eventId, unsentGuestIds)
      const sent = result.sent.length
      const failed = result.failed.length
      if (sent === 0 && failed > 0) {
        toast.error(t('bulkSummary.allFailed', { count: failed }))
      } else if (failed === 0) {
        toast.success(t('bulkSummary.success', { count: sent }))
      } else {
        toast.message(t('bulkSummary.partial', { sent, failed }))
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={count === 0}
        >
          <Send className="h-4 w-4" />
          {t('bulkButton', { count })}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent
        className={cn(FLOATING_SURFACE, 'rounded-2xl sm:max-w-md')}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            {t('confirmTitle', { count })}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white/70">
            {t('confirmBody')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline" disabled={pending}>
            {t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              e.preventDefault()
              handleConfirm()
            }}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('confirmCta')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
