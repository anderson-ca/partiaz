import { getTranslations } from 'next-intl/server'
import { DeleteGuestButton } from '@/components/guests/DeleteGuestButton'
import { Pill, type PillProps } from '@/components/ui/pill'
import { formatPhoneDisplay } from '@/lib/phone'

export type GuestListItem = {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  rsvp: 'pending' | 'yes' | 'no' | 'maybe'
}

type GuestListProps = {
  eventId: string
  guests: GuestListItem[]
}

const STATUS_VARIANT: Record<GuestListItem['rsvp'], PillProps['variant']> = {
  yes: 'success',
  maybe: 'info',
  no: 'muted',
  pending: 'muted',
}

const SECTION_ORDER: GuestListItem['rsvp'][] = ['yes', 'maybe', 'no', 'pending']

export async function GuestList({ eventId, guests }: GuestListProps) {
  const t = await getTranslations('events.guests')

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
                <GuestRow key={g.id} eventId={eventId} guest={g} />
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
}: {
  eventId: string
  guest: GuestListItem
}) {
  const t = await getTranslations('events.guests')
  const displayName = guest.name?.trim() || '—'
  const phoneDisplay = guest.phone ? formatPhoneDisplay(guest.phone) : null
  const variant = STATUS_VARIANT[guest.rsvp]
  return (
    <li className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-white">{displayName}</p>
        {(phoneDisplay || guest.email) && (
          <p className="truncate text-xs text-white/50">
            {[phoneDisplay, guest.email].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
      <Pill variant={variant} className="shrink-0">
        {t(`status.${guest.rsvp}`)}
      </Pill>
      <DeleteGuestButton
        eventId={eventId}
        guestId={guest.id}
        guestLabel={displayName}
      />
    </li>
  )
}
