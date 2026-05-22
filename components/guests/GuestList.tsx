import { getLocale, getTranslations } from 'next-intl/server'
import { DeleteGuestButton } from '@/components/guests/DeleteGuestButton'
import { GuestMessageButton } from '@/components/guests/GuestMessageButton'
import { SendInviteButton } from '@/components/guests/SendInviteButton'
import { Pill, type PillProps } from '@/components/ui/pill'
import { formatPhoneDisplay } from '@/lib/phone'

export type GuestListItem = {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  rsvp: 'pending' | 'yes' | 'no' | 'maybe'
  invited_at: string | null
  invite_channel: 'sms' | 'email' | null
  /** ISO timestamp of most recent guest submit. null = host added but
   *  the guest hasn't responded yet — drives the "No response yet"
   *  badge variant. Distinct from `rsvp` because a row CAN exist with
   *  `rsvp: 'pending'` + `responded_at: null` from the [11a] host-add
   *  flow before [12b] submission lands. */
  responded_at: string | null
  /** Counts of adult / child plus-ones the guest is bringing. Only
   *  meaningful when rsvp === 'yes'. */
  plus_one_adults: number
  plus_one_children: number
  /** Free-form guest-to-host note. Null/empty hides the message
   *  indicator on the row. */
  guest_message: string | null
}

type GuestListProps = {
  eventId: string
  guests: GuestListItem[]
}

// Section grouping uses these. Sections always group by stored `rsvp` to
// keep the heading→count math obvious. Per-row badges use a slightly
// different lookup below so we can distinguish "no response yet" from
// stored 'no'.
const STATUS_VARIANT: Record<GuestListItem['rsvp'], PillProps['variant']> = {
  yes: 'success',
  maybe: 'info',
  no: 'destructive',
  pending: 'muted',
}

// Effective badge state: prefer `responded_at === null` for the
// "no response yet" determination over `rsvp === 'pending'`. A guest can
// in theory have rsvp='pending' AND a responded_at (DB edge state); we
// treat responded_at as the source of truth for whether the guest has
// actually clicked submit.
function effectiveStatus(
  guest: GuestListItem,
): { key: 'yes' | 'no' | 'maybe' | 'pending'; variant: PillProps['variant'] } {
  if (guest.responded_at === null) {
    return { key: 'pending', variant: 'muted' }
  }
  return { key: guest.rsvp, variant: STATUS_VARIANT[guest.rsvp] }
}

const SECTION_ORDER: GuestListItem['rsvp'][] = ['yes', 'maybe', 'no', 'pending']

// Small helper — picks the largest unit that fits and runs through
// Intl.RelativeTimeFormat. Same pattern as EventCard already uses; no new
// date-fns import.
function formatRelativeAgo(iso: string, locale: string): string {
  const diffSec = Math.round((new Date(iso).getTime() - Date.now()) / 1000)
  const abs = Math.abs(diffSec)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  if (abs < 60) return rtf.format(Math.round(diffSec), 'second')
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour')
  return rtf.format(Math.round(diffSec / 86400), 'day')
}

export async function GuestList({ eventId, guests }: GuestListProps) {
  const t = await getTranslations('events.guests')
  const locale = await getLocale()

  if (guests.length === 0) {
    return (
      <div className="rounded-2xl bg-black/30 p-6 text-center ring-1 ring-white/10 backdrop-blur-md">
        <p className="text-sm text-white/70">{t('emptyState')}</p>
      </div>
    )
  }

  const grouped: Record<GuestListItem['rsvp'], GuestListItem[]> = {
    yes: [],
    maybe: [],
    no: [],
    pending: [],
  }
  for (const g of guests) grouped[g.rsvp].push(g)

  return (
    <div className="space-y-4">
      {SECTION_ORDER.map((status) => {
        const rows = grouped[status]
        if (rows.length === 0) return null
        return (
          <section
            key={status}
            className="space-y-2 rounded-2xl bg-black/30 p-4 ring-1 ring-white/10 backdrop-blur-md"
          >
            <header className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-white">
                {t(`status.${status}`)}
              </h3>
              <span className="text-xs text-white/50">{rows.length}</span>
            </header>
            <ul className="divide-y divide-white/5">
              {rows.map((g) => (
                <GuestRow
                  key={g.id}
                  eventId={eventId}
                  guest={g}
                  locale={locale}
                />
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

async function GuestRow({
  eventId,
  guest,
  locale,
}: {
  eventId: string
  guest: GuestListItem
  locale: string
}) {
  const t = await getTranslations('events.guests')
  const tSend = await getTranslations('events.guests.send')
  const tRsvp = await getTranslations('rsvp')
  const displayName = guest.name?.trim() || '—'
  const phoneDisplay = guest.phone ? formatPhoneDisplay(guest.phone) : null
  const status = effectiveStatus(guest)
  const messageTrimmed = guest.guest_message?.trim() ?? ''
  const hasMessage = messageTrimmed.length > 0

  let inviteStatus: string
  if (!guest.invited_at) {
    inviteStatus = tSend('status.notInvited')
  } else {
    const relative = formatRelativeAgo(guest.invited_at, locale)
    inviteStatus = tSend(
      guest.invite_channel === 'email' ? 'status.emailSent' : 'status.smsSent',
      { relativeTime: relative },
    )
  }

  // Plus-one inline line — only on `yes` rows with non-zero counts.
  // Composes "Bringing 2 adults and 1 child" / "Bringing 1 adult" / etc.
  // Reuses the [12b] ICU plurals so host-side and guest-side wording stay
  // identical.
  const showPlusOne =
    guest.rsvp === 'yes' &&
    (guest.plus_one_adults > 0 || guest.plus_one_children > 0)

  return (
    <li className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-white">{displayName}</p>
        {(phoneDisplay || guest.email) && (
          <p className="truncate text-xs text-white/50">
            {[phoneDisplay, guest.email].filter(Boolean).join(' · ')}
          </p>
        )}
        {showPlusOne && (
          <p className="truncate pt-0.5 text-xs text-emerald-300/80">
            {tRsvp('plusOneSummaryBringing')}{' '}
            {guest.plus_one_adults > 0 &&
              tRsvp('plusOneAdultsCount', { count: guest.plus_one_adults })}
            {guest.plus_one_adults > 0 && guest.plus_one_children > 0 && (
              <> {tRsvp('plusOneAnd')} </>
            )}
            {guest.plus_one_children > 0 &&
              tRsvp('plusOneChildrenCount', { count: guest.plus_one_children })}
          </p>
        )}
        <p className="truncate pt-0.5 text-xs text-white/40">{inviteStatus}</p>
      </div>
      {hasMessage && (
        <GuestMessageButton
          message={messageTrimmed}
          guestLabel={displayName}
        />
      )}
      <Pill variant={status.variant} className="shrink-0">
        {t(`status.${status.key}`)}
      </Pill>
      <SendInviteButton
        eventId={eventId}
        guestId={guest.id}
        invitedAt={guest.invited_at}
        phone={guest.phone}
        email={guest.email}
      />
      <DeleteGuestButton
        eventId={eventId}
        guestId={guest.id}
        guestLabel={displayName}
      />
    </li>
  )
}
