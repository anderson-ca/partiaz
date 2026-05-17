'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import type { CurrentGuest, RsvpStatus } from '@/app/actions/rsvp'
import { Button } from '@/components/ui/button'
import { Pill } from '@/components/ui/pill'
import { RsvpDialog } from '@/components/event/RsvpDialog'
import { cn } from '@/lib/utils'

const STATUS_PILL: Record<RsvpStatus | 'pending', 'success' | 'info' | 'muted'> = {
  yes: 'success',
  maybe: 'info',
  no: 'muted',
  pending: 'muted',
}

type RsvpCtaProps = {
  eventSlug: string
  /** The viewer's current RSVP, or null if they haven't responded. */
  currentGuest: CurrentGuest | null
  /** Pre-fill for first-time RSVP (logged-in user's display_name). */
  defaultName?: string
  allowMaybe: boolean
  requireNames: boolean
  /** Host-set toggle ([12a]). When false, the "Edit RSVP" button is
   *  hidden after the guest has responded (responded_at != null). */
  allowRsvpEdit: boolean
  /** Host-set toggle ([12a]). Passed to the dialog so it conditionally
   *  renders the plus-one steppers. */
  plusOneEnabled: boolean
  plusOneMaxAdults: number
  plusOneMaxChildren: number
}

export function RsvpCta({
  eventSlug,
  currentGuest,
  defaultName,
  allowMaybe,
  requireNames,
  allowRsvpEdit,
  plusOneEnabled,
  plusOneMaxAdults,
  plusOneMaxChildren,
}: RsvpCtaProps) {
  const t = useTranslations('rsvp')
  const [open, setOpen] = React.useState(false)

  const status: RsvpStatus | 'pending' = currentGuest
    ? (currentGuest.rsvp as RsvpStatus | 'pending')
    : 'pending'
  const hasResponse = currentGuest && status !== 'pending'

  // Build the contact string back from email/phone columns. The action
  // splits it on save; we re-join here so the user's previously-entered
  // value lands back in the same single field.
  const contactForEdit = currentGuest
    ? currentGuest.email ?? currentGuest.phone ?? ''
    : ''

  // If the host has since disabled Maybe but the guest's stored status is
  // 'maybe', drop the pre-fill so the dialog opens with no status selected
  // — forcing them to pick Yes or No before re-submit.
  const initialStatus: RsvpStatus =
    status === 'pending' || (status === 'maybe' && !allowMaybe)
      ? 'yes'
      : status
  const initial = currentGuest
    ? {
        status: initialStatus,
        name: currentGuest.name,
        contact: contactForEdit,
        message: currentGuest.guest_message ?? '',
        plusOneAdults: currentGuest.plus_one_adults ?? 0,
        plusOneChildren: currentGuest.plus_one_children ?? 0,
      }
    : null

  // Plus-one summary line for the post-response view. Only render when the
  // guest said yes AND brought at least one — keeps the UI quiet when
  // they're just going solo.
  const plusOneAdults = currentGuest?.plus_one_adults ?? 0
  const plusOneChildren = currentGuest?.plus_one_children ?? 0
  const showPlusOneSummary =
    hasResponse &&
    status === 'yes' &&
    (plusOneAdults > 0 || plusOneChildren > 0)

  // Edit button is hidden when the host disabled re-submits AFTER the
  // guest already responded once. A guest who hasn't responded yet always
  // sees the CTA — `allow_rsvp_edit` only gates re-submits.
  const canEdit = !hasResponse || allowRsvpEdit

  return (
    <div className="space-y-3">
      {hasResponse && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-center">
            <Pill variant={STATUS_PILL[status]} className="text-xs">
              {t(`yourStatus.${status}`)}
            </Pill>
          </div>
          {showPlusOneSummary && (
            <p className="text-center text-xs text-white/70">
              {t('plusOneSummaryBringing')}{' '}
              {plusOneAdults > 0 &&
                t('plusOneAdultsCount', { count: plusOneAdults })}
              {plusOneAdults > 0 && plusOneChildren > 0 && (
                <> {t('plusOneAnd')} </>
              )}
              {plusOneChildren > 0 &&
                t('plusOneChildrenCount', { count: plusOneChildren })}
            </p>
          )}
        </div>
      )}
      {canEdit && (
        <Button
          type="button"
          size="lg"
          className={cn(
            'w-full',
            hasResponse && 'bg-white/10 text-white hover:bg-white/20',
          )}
          variant={hasResponse ? 'secondary' : 'default'}
          onClick={() => setOpen(true)}
        >
          {hasResponse ? t('ctaEdit') : t('cta')}
        </Button>
      )}

      <RsvpDialog
        open={open}
        onOpenChange={setOpen}
        eventSlug={eventSlug}
        initial={initial}
        defaultName={defaultName}
        allowMaybe={allowMaybe}
        requireNames={requireNames}
        plusOneEnabled={plusOneEnabled}
        plusOneMaxAdults={plusOneMaxAdults}
        plusOneMaxChildren={plusOneMaxChildren}
      />
    </div>
  )
}
