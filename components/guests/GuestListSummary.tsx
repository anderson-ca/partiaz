import { getTranslations } from 'next-intl/server'
import type { GuestListItem } from '@/components/guests/GuestList'
import { Pill, type PillProps } from '@/components/ui/pill'

type GuestListSummaryProps = {
  guests: GuestListItem[]
}

type Counts = {
  yes: number
  no: number
  maybe: number
  noResponse: number
  plusOneAdults: number
  plusOneChildren: number
}

// Pure aggregator — counts statuses + sums plus-ones across the (already
// loaded) list. Linear pass, runs at request time on the server. No need
// for a memo since this component only renders once per request.
function aggregate(guests: GuestListItem[]): Counts {
  const c: Counts = {
    yes: 0,
    no: 0,
    maybe: 0,
    noResponse: 0,
    plusOneAdults: 0,
    plusOneChildren: 0,
  }
  for (const g of guests) {
    // `responded_at === null` is the source of truth for "no response yet",
    // not `rsvp === 'pending'` — see [11a] note in GuestList.tsx.
    if (g.responded_at === null) {
      c.noResponse++
      continue
    }
    if (g.rsvp === 'yes') {
      c.yes++
      c.plusOneAdults += g.plus_one_adults
      c.plusOneChildren += g.plus_one_children
    } else if (g.rsvp === 'no') {
      c.no++
    } else if (g.rsvp === 'maybe') {
      c.maybe++
    } else {
      // rsvp = 'pending' + responded_at set is a theoretical edge state
      // (would only happen if the DB were edited directly). Bucket as
      // "no response" to keep counters balanced.
      c.noResponse++
    }
  }
  return c
}

export async function GuestListSummary({ guests }: GuestListSummaryProps) {
  const t = await getTranslations('events.guests.summary')
  const counts = aggregate(guests)
  const expectedAttendees =
    counts.yes + counts.plusOneAdults + counts.plusOneChildren
  const totalPlusOnes = counts.plusOneAdults + counts.plusOneChildren

  return (
    <section className="space-y-3 rounded-2xl bg-black/30 p-4 ring-1 ring-white/10 backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-2">
        <StatPill variant="success" label={t('yesCount')} value={counts.yes} />
        <StatPill variant="info" label={t('maybeCount')} value={counts.maybe} />
        <StatPill
          variant="destructive"
          label={t('noCount')}
          value={counts.no}
        />
        <StatPill
          variant="muted"
          label={t('noResponseCount')}
          value={counts.noResponse}
        />
      </div>

      {/* Expected attendees gets its own row with emphasis. The
          breakdown ("12 guests + 6 plus-ones") only shows when at least
          one plus-one exists — keeps the line quiet for events that
          don't use the feature. */}
      <div className="flex items-baseline justify-between border-t border-white/10 pt-3">
        <span className="text-xs uppercase tracking-wide text-white/60">
          {t('expectedAttendeesLabel')}
        </span>
        <span className="text-right">
          <span className="text-2xl font-semibold tabular-nums text-white">
            {expectedAttendees}
          </span>
          {totalPlusOnes > 0 && (
            <span className="block text-xs text-white/50">
              {t('expectedAttendeesBreakdown', {
                guests: counts.yes,
                plusOnes: totalPlusOnes,
              })}
            </span>
          )}
        </span>
      </div>
    </section>
  )
}

function StatPill({
  variant,
  label,
  value,
}: {
  variant: PillProps['variant']
  label: string
  value: number
}) {
  return (
    <Pill variant={variant} className="gap-1.5">
      <span className="tabular-nums font-semibold">{value}</span>
      <span className="text-[10px] uppercase tracking-wide opacity-80">
        {label}
      </span>
    </Pill>
  )
}
