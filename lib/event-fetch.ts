import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// Single source of truth for the public-event SELECT — used by the page
// renderer AND by `generateMetadata` via React `cache()` dedup so we never
// double-query per request.
export const EVENT_SELECT = `id, slug, title, status, audience, text_color, cover_image_url,
       cover_overlay_enabled, cover_overlay_text, cover_overlay_color,
       starts_at, ends_at, location_text, location_address, description,
       capacity, show_guest_count, show_guest_names, allow_maybe,
       require_names, location_hidden_until_rsvp,
       plus_one_enabled, plus_one_max_adults, plus_one_max_children,
       allow_rsvp_edit, show_payment_info,
       theme:themes(id,name,category,background_type,background_value,recommended_text_color,order_index),
       effect:effects(id,name,category,engine,config),
       font_preset:font_presets!events_font_preset_id_fkey(id,name,category,font_family,font_weight,letter_spacing,text_transform),
       overlay_font:font_presets!events_cover_overlay_font_id_fkey(font_family,font_weight,letter_spacing,text_transform),
       host:profiles!events_host_id_fkey(id,display_name,avatar_url,locale,payment_methods),
       cohosts:event_cohosts(user_id,profile:profiles!event_cohosts_user_id_fkey(display_name,avatar_url))`

type FetchResult = {
  // Caller-side typed downstream as the inferred Supabase row shape; we
  // re-type at the call site (page.tsx already does this dance).
  event: Awaited<ReturnType<typeof rawFetch>>['event']
  isTokenAuth: boolean
} | null

async function rawFetch(slug: string, inviteToken: string | undefined) {
  // Three-branch access model. Priority order (token first, then session,
  // then RLS-public fallback) is load-bearing — see each branch's preamble
  // for the specific RLS interaction that motivates the order.
  //
  // All branches return the same `{ event, isTokenAuth }` shape so the
  // caller doesn't need to know which path resolved.

  // ─── Branch 1: token-bearer (service-role) ────────────────────────────
  // When the URL carries `?t=<token>`, the invite token is the access
  // proof. Service-role for both the guest lookup AND the event fetch so
  // RLS on every table in the join (notably `profiles_select_self`) is
  // bypassed.
  //
  // Why this branch runs FIRST and not as a fallback: the previous order
  // tried anon-RLS first and fell through to token only when the outer
  // event row came back null. But `profiles_select_self` (from [02])
  // denies anon SELECT on profiles, so anon fetch on a published event
  // returns the event row WITH `host: null`. That's a non-null event, so
  // the short-circuit succeeded and the token branch never ran. The page
  // then 404'd at `if (!event.host)`. Fixed in [11c.7.2].
  //
  // Defense-in-depth: constrain the event lookup by BOTH `id =
  // guest.event_id` AND `slug = <param>`. A leaked token paired with a
  // fabricated slug (phishing to a different event) mismatches → null.
  if (inviteToken) {
    const service = createServiceClient()
    const { data: tokenGuest } = await service
      .from('guests')
      .select('event_id')
      .eq('invite_token', inviteToken)
      .maybeSingle()
    if (!tokenGuest) {
      return { event: null, isTokenAuth: false as const }
    }
    const { data: tokenEvent } = await service
      .from('events')
      .select(EVENT_SELECT)
      .eq('id', tokenGuest.event_id)
      .eq('slug', slug)
      .maybeSingle()
    if (tokenEvent) {
      return { event: tokenEvent, isTokenAuth: true as const }
    }
    return { event: null, isTokenAuth: false as const }
  }

  // ─── Branch 2: authenticated host/cohost (service-role) ──────────────
  // Logged-in viewers who are the primary host or a co-host of this event.
  // RLS on `events` would let them see the row, but the join to `profiles`
  // (host avatar / display_name / locale) is denied by `profiles_select_self`
  // — they'd get `host: null` and the page would 404. Same bug class as
  // [11c.7.2], unfixed for session-auth until now.
  //
  // We can't use the `is_event_host_or_cohost` RPC here: it's
  // `security definer` and keys off `auth.uid()`, which returns null
  // under the service-role connection. Inline the membership check as
  // two cheap indexed queries instead (slug PK, then composite PK on
  // event_cohosts).
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const service = createServiceClient()
    const { data: shell } = await service
      .from('events')
      .select('id, host_id')
      .eq('slug', slug)
      .maybeSingle()
    if (shell) {
      const isHost = shell.host_id === user.id
      let isCohost = false
      if (!isHost) {
        const { count } = await service
          .from('event_cohosts')
          .select('user_id', { count: 'exact', head: true })
          .eq('event_id', shell.id)
          .eq('user_id', user.id)
        isCohost = (count ?? 0) > 0
      }
      if (isHost || isCohost) {
        const { data: memberEvent } = await service
          .from('events')
          .select(EVENT_SELECT)
          .eq('id', shell.id)
          .maybeSingle()
        if (memberEvent) {
          return { event: memberEvent, isTokenAuth: false as const }
        }
      }
    }
  }

  // ─── Branch 3: anon/auth RLS fallback ────────────────────────────────
  // Last resort for viewers who are neither token-bearers nor members.
  // Currently only reachable by an anon visitor guessing a published-event
  // slug. The host-profile join still returns null under anon RLS (per
  // `profiles_select_self`), so this branch 404s by design until the
  // `audience='public_profile'` flow (CLAUDE.md schema-realities) ships
  // with a profile policy that surfaces host display data for public
  // events. Kept as a structural placeholder so that work is one branch
  // edit rather than a re-architecture.
  const { data: anonEvent } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .eq('slug', slug)
    .maybeSingle()

  if (anonEvent) return { event: anonEvent, isTokenAuth: false as const }
  return { event: null, isTokenAuth: false as const }
}

/**
 * Fetch a single event by slug for the public landing page.
 *
 * Wrapped in React `cache()` so `generateMetadata` and `PublicEventPage` —
 * both invoked once per request — share a single DB roundtrip. The cache
 * key is the (slug, inviteToken) tuple; calls with the same args within
 * one request return the same Promise.
 *
 * Returns `{ event, isTokenAuth }`. `event` is `null` when neither anon
 * RLS nor the token bearer path resolved a row. Callers decide what to do
 * with that (the page calls `notFound()`, metadata returns a minimal stub).
 */
export const getEventForView = cache(
  async (
    slug: string,
    inviteToken: string | undefined,
  ): Promise<FetchResult> => {
    return rawFetch(slug, inviteToken)
  },
)
