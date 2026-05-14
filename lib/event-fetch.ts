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
  const supabase = await createClient()
  const { data: anonEvent } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .eq('slug', slug)
    .maybeSingle()

  if (anonEvent) return { event: anonEvent, isTokenAuth: false as const }

  // Invite-token bearer auth fallback — same mechanism as [11c]. Token
  // possession authorizes a service-role re-fetch; we verify the token
  // matches a guest on this event before handing back the row.
  if (inviteToken) {
    const service = createServiceClient()
    const { data: tokenEvent } = await service
      .from('events')
      .select(EVENT_SELECT)
      .eq('slug', slug)
      .maybeSingle()
    if (tokenEvent) {
      const { data: tokenGuest } = await service
        .from('guests')
        .select('id')
        .eq('event_id', tokenEvent.id)
        .eq('invite_token', inviteToken)
        .maybeSingle()
      if (tokenGuest) return { event: tokenEvent, isTokenAuth: true as const }
    }
  }

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
