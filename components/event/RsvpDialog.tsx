'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { StepperRow } from '@/components/ui/stepper-row'
import { Textarea } from '@/components/ui/textarea'
import { FLOATING_SURFACE } from '@/lib/ui/floating-surface'
import { cn } from '@/lib/utils'

// Mirrors the server-side cap in app/actions/rsvp.ts. The textarea
// `maxLength` enforces this on the client; the action re-validates.
const GUEST_MESSAGE_MAX = 280

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
   *  pre-filled. As of [12b.3] does NOT carry name or contact; name is
   *  host-controlled and surfaced separately via `existingName`. */
  initial: {
    status: RsvpStatus
    message: string
    plusOneAdults: number
    plusOneChildren: number
  } | null
  /** Guest's host-set name. Non-empty → render read-only "RSVPing as: X"
   *  and never accept name updates. Empty/blank → render a required name
   *  input so the guest can claim a label on their first response. */
  existingName: string
  /** Pre-fill for the name input when `existingName` is blank — typically
   *  the logged-in viewer's profile display_name. Ignored when
   *  `existingName` is set. */
  defaultName?: string
  /** Per-event toggle. When false, the Maybe button isn't rendered and the
   *  default initial status is forced to Yes by the parent. */
  allowMaybe: boolean
  /** Per-event toggle. When false, the name field reads as optional with
   *  an "Anonymous (optional)" placeholder; server fills 'Anonymous' on
   *  empty submission. Only relevant when `existingName` is blank. */
  requireNames: boolean
  /** Per-event toggle (added [12a]). When false, the plus-one section is
   *  not rendered and the server rejects any non-zero plus-one submission. */
  plusOneEnabled: boolean
  /** 0..5, enforced both client (stepper clamp) and server (cap check). */
  plusOneMaxAdults: number
  plusOneMaxChildren: number
}

export function RsvpDialog({
  open,
  onOpenChange,
  eventSlug,
  initial,
  existingName,
  defaultName,
  allowMaybe,
  requireNames,
  plusOneEnabled,
  plusOneMaxAdults,
  plusOneMaxChildren,
}: RsvpDialogProps) {
  const t = useTranslations('rsvp')
  const isEdit = initial !== null
  // [12b.3]: the `?t=<invite-token>` URL param is the anon identity proof,
  // threaded into submitRsvp so the action can resolve the right row
  // without relying on a cookie that may not have been set yet.
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('t') ?? undefined

  // Render mode: when the host already set a name on the guest row, show
  // it read-only. The guest can't rename themselves through this surface.
  const hasStoredName = existingName.trim().length > 0

  const [status, setStatus] = React.useState<RsvpStatus>(
    initial?.status ?? 'yes',
  )
  const [name, setName] = React.useState(defaultName ?? '')
  const [message, setMessage] = React.useState(initial?.message ?? '')
  const [plusOneAdults, setPlusOneAdults] = React.useState(() =>
    Math.min(initial?.plusOneAdults ?? 0, plusOneMaxAdults),
  )
  const [plusOneChildren, setPlusOneChildren] = React.useState(() =>
    Math.min(initial?.plusOneChildren ?? 0, plusOneMaxChildren),
  )
  const [nameError, setNameError] = React.useState<string | null>(null)
  const [pending, startTransition] = React.useTransition()
  const router = useRouter()

  // Reset form when the dialog re-opens with different `initial` (e.g.
  // user edits, host removes, then user re-rsvps).
  React.useEffect(() => {
    if (open) {
      setStatus(initial?.status ?? 'yes')
      setName(defaultName ?? '')
      setMessage(initial?.message ?? '')
      setPlusOneAdults(Math.min(initial?.plusOneAdults ?? 0, plusOneMaxAdults))
      setPlusOneChildren(
        Math.min(initial?.plusOneChildren ?? 0, plusOneMaxChildren),
      )
      setNameError(null)
    }
  }, [open, initial, defaultName, plusOneMaxAdults, plusOneMaxChildren])

  function handleSubmit() {
    // Name validation — only relevant when the input is actually rendered.
    // When `hasStoredName` the field is read-only and we don't send name.
    let nameToSend: string | undefined
    if (!hasStoredName) {
      const trimmed = name.trim()
      if (requireNames && trimmed.length < 1) {
        setNameError(t('errors.name_required'))
        return
      }
      if (trimmed.length > 100) {
        setNameError(t('errors.invalid_input'))
        return
      }
      nameToSend = trimmed || undefined
    }
    setNameError(null)

    // Plus-ones only apply to 'yes' AND when the host enabled them.
    const adultsToSend =
      status === 'yes' && plusOneEnabled ? plusOneAdults : 0
    const childrenToSend =
      status === 'yes' && plusOneEnabled ? plusOneChildren : 0

    startTransition(async () => {
      const result = await submitRsvp({
        eventSlug,
        status,
        inviteToken,
        name: nameToSend,
        message: message.trim() || undefined,
        plusOneAdults: adultsToSend,
        plusOneChildren: childrenToSend,
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
          {/* Identity line — read-only when the host set a name; the guest
              can't change it through this surface ([12b.3]). */}
          {hasStoredName && (
            <p className="text-sm text-white/70">
              {t('rsvpingAsLabel', { name: existingName })}
            </p>
          )}

          {/* Status — pill buttons, single-select. Maybe is hidden when the
              host has disabled it via the settings panel. */}
          <div
            className={cn(
              'grid gap-2',
              allowMaybe ? 'grid-cols-3' : 'grid-cols-2',
            )}
          >
            {(['yes', 'maybe', 'no'] as const).map((s) => {
              if (s === 'maybe' && !allowMaybe) return null
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

          {/* Plus-ones — only when (a) host enabled them and (b) guest
              picked 'yes'. */}
          {plusOneEnabled && status === 'yes' && (
            <div className="space-y-2 rounded-xl bg-white/5 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-white/50">
                {t('plusOneSectionLabel')}
              </p>
              <StepperRow
                label={t('plusOneAdultsLabel')}
                value={plusOneAdults}
                onChange={setPlusOneAdults}
                max={plusOneMaxAdults}
              />
              <StepperRow
                label={t('plusOneChildrenLabel')}
                value={plusOneChildren}
                onChange={setPlusOneChildren}
                max={plusOneMaxChildren}
              />
            </div>
          )}

          {/* Name — input only when the host hasn't already set one on
              the guest row. Once stored, the read-only display above
              replaces this. */}
          {!hasStoredName && (
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
                required={requireNames}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  requireNames
                    ? t('namePlaceholder')
                    : t('nameOptionalPlaceholder')
                }
                className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus-visible:border-violet-400/60 focus-visible:ring-2 focus-visible:ring-violet-400/40"
              />
              {nameError && (
                <p className="mt-1 text-xs text-rose-300">{nameError}</p>
              )}
            </div>
          )}

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
              maxLength={GUEST_MESSAGE_MAX}
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
