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
       allow_rsvp_edit,
       theme:themes(id,name,category,background_type,background_value,recommended_text_color,order_index),
       effect:effects(id,name,category,engine,config),
       font_preset:font_presets!events_font_preset_id_fkey(id,name,category,font_family,font_weight,letter_spacing,text_transform),
       overlay_font:font_presets!events_cover_overlay_font_id_fkey(font_family,font_weight,letter_spacing,text_transform),
       host:profiles!events_host_id_fkey(id,display_name,avatar_url,locale),
       cohosts:event_cohosts(user_id,profile:profiles!event_cohosts_user_id_fkey(display_name,avatar_url))`

type FetchResult = {
  // Caller-side typed downstream as the inferred Supabase row shape; we
  // re-type at the call site (page.tsx already does this dance).
  event: Awaited<ReturnType<typeof rawFetch>>['event']
  isTokenAuth: boolean
} | null

async function rawFetch(slug: string, inviteToken: string | undefined) {
  // ─── Token-bearer path (priority) ────────────────────────────────────
  // When the URL carries `?t=<token>`, the invite token itself is the
  // access proof. Use service-role for both the guest lookup AND the
  // event fetch — service-role bypasses RLS on every table in the join.
  //
  // Why this branch runs FIRST rather than as a fallback:
  //   The previous order tried anon-RLS first and fell through to token
  //   only when the outer event row came back null. But `profiles_select_self`
  //   (from [02]) denies anon SELECT on profiles, so anon fetch on a
  //   published event returns the event row WITH `host: null` and
  //   `cohosts[].profile: null`. That's a non-null `anonEvent`, so the
  //   short-circuit succeeded and the token branch never ran. The page
  //   then 404'd at `if (!event.host)`. Bug fixed in [11c.7.2] by
  //   restructuring: token presence routes through service-role first.
  //
  // Defense-in-depth on the event lookup: we constrain by BOTH
  // `id = guest.event_id` AND `slug = <param>`. A leaked token paired
  // with a fabricated slug (e.g., to phish a recipient to a different
  // event's page) will mismatch and return null.
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

  // ─── No-token path ───────────────────────────────────────────────────
  // Anon-RLS fetch. Host/co-host viewers (with a session) see drafts +
  // own events via RLS. Anon viewers see published+public events the
  // policy allows.
  //
  // Known limitation today: `profiles_select_self` denies anon reads,
  // so a logged-out viewer of a public event will see `host: null` and
  // 404 at the page-level guard. Resolving requires a partial policy
  // (anon can SELECT profile rows referenced as events.host_id) and is
  // out of scope for [11c.7.2]. Logged-in viewers — and anyone with a
  // valid invite token, who routes through the branch above — are
  // unaffected.
  const supabase = await createClient()
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
