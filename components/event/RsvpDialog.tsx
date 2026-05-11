'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { submitRsvp, type RsvpStatus } from '@/app/actions/rsvp'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FLOATING_SURFACE } from '@/lib/ui/floating-surface'
import { cn } from '@/lib/utils'

const STATUS_ICON: Record<RsvpStatus, string> = {
  yes: '✅',
  maybe: '🤔',
  no: '😢',
}

type RsvpDialogProps = {
  open: boolean
  onOpenChange: (next: boolean) => void
  eventSlug: string
  /** Existing RSVP — when set, dialog renders in "Update" mode with values
   *  pre-filled. */
  initial: {
    status: RsvpStatus
    name: string
    contact: string
    message: string
  } | null
  /** Pre-fill for first-time RSVP — name from auth profile if present.
   *  Ignored when `initial` is set. */
  defaultName?: string
}

export function RsvpDialog({
  open,
  onOpenChange,
  eventSlug,
  initial,
  defaultName,
}: RsvpDialogProps) {
  const t = useTranslations('rsvp')
  const isEdit = initial !== null

  const [status, setStatus] = React.useState<RsvpStatus>(
    initial?.status ?? 'yes',
  )
  const [name, setName] = React.useState(initial?.name ?? defaultName ?? '')
  const [contact, setContact] = React.useState(initial?.contact ?? '')
  const [message, setMessage] = React.useState(initial?.message ?? '')
  const [nameError, setNameError] = React.useState<string | null>(null)
  const [pending, startTransition] = React.useTransition()
  const router = useRouter()

  // Reset form when the dialog re-opens with different `initial` (e.g. user
  // edits, host removes, then user re-rsvps).
  React.useEffect(() => {
    if (open) {
      setStatus(initial?.status ?? 'yes')
      setName(initial?.name ?? defaultName ?? '')
      setContact(initial?.contact ?? '')
      setMessage(initial?.message ?? '')
      setNameError(null)
    }
  }, [open, initial, defaultName])

  function handleSubmit() {
    const trimmed = name.trim()
    if (trimmed.length < 1 || trimmed.length > 100) {
      setNameError(t('errors.invalid_input'))
      return
    }
    setNameError(null)

    startTransition(async () => {
      const result = await submitRsvp({
        eventSlug,
        status,
        name: trimmed,
        contact: contact.trim() || undefined,
        message: message.trim() || undefined,
      })

      if (!result.ok) {
        toast.error(t(`errors.${result.error}`))
        return
      }
      toast.success(isEdit ? t('updateToast') : t('successToast'))
      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(FLOATING_SURFACE, 'rounded-2xl text-white sm:max-w-md')}
      >
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('dialogTitleEdit') : t('dialogTitle')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit ? t('dialogTitleEdit') : t('dialogTitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status — three large pill buttons, single-select */}
          <div className="grid grid-cols-3 gap-2">
            {(['yes', 'maybe', 'no'] as const).map((s) => {
              const active = status === s
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-xs font-medium transition-all duration-150',
                    active
                      ? 'border-violet-400 bg-violet-500/15 text-white'
                      : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10',
                  )}
                >
                  <span className="text-2xl" aria-hidden>
                    {STATUS_ICON[s]}
                  </span>
                  <span>{t(`statusButtons.${s}`)}</span>
                </button>
              )
            })}
          </div>

          {/* Name */}
          <div>
            <label
              htmlFor="rsvp-name"
              className="mb-1.5 block text-xs font-medium text-white/70"
            >
              {t('nameLabel')}
            </label>
            <Input
              id="rsvp-name"
              type="text"
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus-visible:border-violet-400/60 focus-visible:ring-2 focus-visible:ring-violet-400/40"
            />
            {nameError && (
              <p className="mt-1 text-xs text-rose-300">{nameError}</p>
            )}
          </div>

          {/* Contact */}
          <div>
            <label
              htmlFor="rsvp-contact"
              className="mb-1.5 block text-xs font-medium text-white/70"
            >
              {t('contactLabel')}
            </label>
            <Input
              id="rsvp-contact"
              type="text"
              maxLength={200}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={t('contactPlaceholder')}
              className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus-visible:border-violet-400/60 focus-visible:ring-2 focus-visible:ring-violet-400/40"
            />
          </div>

          {/* Message */}
          <div>
            <label
              htmlFor="rsvp-message"
              className="mb-1.5 block text-xs font-medium text-white/70"
            >
              {t('messageLabel')}
            </label>
            <Textarea
              id="rsvp-message"
              rows={3}
              maxLength={1000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('messagePlaceholder')}
              className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus-visible:border-violet-400/60 focus-visible:ring-2 focus-visible:ring-violet-400/40"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            {t('cancel')}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? t('updateButton') : t('submitButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
