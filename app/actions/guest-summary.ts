import 'server-only'
import { createServiceClient } from '@/lib/supabase/service'

export type GuestSummary = {
  going: number
  maybe: number
  no: number
  /** Names of 'yes' guests, ordered by responded_at (most recent first).
   *  Only populated when the caller requests them — empty array otherwise. */
  goingNames: string[]
}

/**
 * Aggregate RSVP counts for the public event page's summary block.
 *
 * Anon viewers can't read `guests` directly (RLS blocks); a host/cohost
 * could but anon can't, and the public page renders for both. So this goes
 * through service-role with a tight, parameterized query that only returns
 * aggregate / opt-in-revealed data.
 *
 * `includeNames` is the host's `show_guest_names` toggle. When false, we
 * skip the name fetch entirely (one fewer round-trip + zero PII leakage).
 */
export async function getGuestSummary(
  eventId: string,
  includeNames: boolean,
): Promise<GuestSummary> {
  const service = createServiceClient()

  const [yesRes, maybeRes, noRes] = await Promise.all([
    service
      .from('guests')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('rsvp', 'yes'),
    service
      .from('guests')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('rsvp', 'maybe'),
    service
      .from('guests')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('rsvp', 'no'),
  ])

  let goingNames: string[] = []
  if (includeNames) {
    const { data } = await service
      .from('guests')
      .select('name, responded_at')
      .eq('event_id', eventId)
      .eq('rsvp', 'yes')
      .order('responded_at', { ascending: false, nullsFirst: false })
      .limit(50)
    goingNames = (data ?? []).map((r) => r.name).filter((n) => n.length > 0)
  }

  return {
    going: yesRes.count ?? 0,
    maybe: maybeRes.count ?? 0,
    no: noRes.count ?? 0,
    goingNames,
  }
}
