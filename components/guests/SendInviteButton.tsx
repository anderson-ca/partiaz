'use client'

import * as React from 'react'
import { Loader2, Mail, MessageSquare, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { sendInvites, type SentChannel } from '@/app/actions/guests'
import { Button } from '@/components/ui/button'

type SendInviteButtonProps = {
  eventId: string
  guestId: string
  invitedAt: string | null
  phone: string | null
  email: string | null
}

export function SendInviteButton({
  eventId,
  guestId,
  invitedAt,
  phone,
  email,
}: SendInviteButtonProps) {
  const t = useTranslations('events.guests.send')
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  function send(overrideChannel?: SentChannel) {
    startTransition(async () => {
      const result = await sendInvites(eventId, [guestId], overrideChannel)
      const sentOne = result.sent[0]
      if (sentOne) {
        toast.success(
          sentOne.channel === 'sms' ? t('success.sms') : t('success.email'),
        )
        router.refresh()
        return
      }
      const reason = result.failed[0]?.reason ?? 'unknown'
      toast.error(t('error', { reason }))
    })
  }

  const isResend = invitedAt !== null
  const hasPhone = !!phone
  const hasEmail = !!email

  // Single-channel guest — keep the simple button UX from [11c].
  if (hasPhone !== hasEmail) {
    return (
      <Button
        type="button"
        variant={isResend ? 'outline' : 'default'}
        size="sm"
        onClick={() => send()}
        disabled={pending}
        className="shrink-0"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {isResend ? t('resend') : t('button')}
      </Button>
    )
  }

  // Both channels available — give the host an explicit pick. We render the
  // two channels as separate compact buttons; the status pill above already
  // shows which one (if either) has been sent.
  return (
    <div className="flex shrink-0 gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => send('sms')}
        disabled={pending}
        aria-label={t('smsAria')}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MessageSquare className="h-4 w-4" />
        )}
        {t('smsButton')}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => send('email')}
        disabled={pending}
        aria-label={t('emailAria')}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        {t('emailButton')}
      </Button>
    </div>
  )
}
