'use server'

import 'server-only'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getLocale, getTranslations } from 'next-intl/server'
import {
  COOKIE_MAX_AGE_SEC,
  COOKIE_PREFIX,
  generateInviteToken,
} from '@/lib/invite-token'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export type RsvpStatus = 'yes' | 'no' | 'maybe'

// Free-form guest-to-host note. 280 cap matches the [12b] textarea
// `maxLength` — both client + server enforce the same ceiling.
const GUEST_MESSAGE_MAX = 280

export type RsvpInput = {
  eventSlug: string
  status: RsvpStatus
  name: string
  /** Free-form. We branch on `@` to decide email vs phone; future prompt
   *  may tighten validation. */
  contact?: string
  /** Optional note from the guest TO the host. Lives in `guest_message`. */
  message?: string
  /** Adult plus-ones the guest is bringing. Defaults to 0. Capped
   *  server-side at `events.plus_one_max_adults` (and rejected entirely
   *  when `events.plus_one_enabled` is false). */
  plusOneAdults?: number
  /** Child plus-ones, same constraints. */
  plusOneChildren?: number
}

export type SubmitRsvpResult =
  | { ok: true; guestId: string; status: RsvpStatus }
  | {
      ok: false
      error:
        | 'event_not_found'
        | 'event_not_published'
        | 'event_full'
        | 'maybe_not_allowed'
        | 'plus_one_not_allowed'
        | 'too_many_adult_plus_ones'
        | 'too_many_child_plus_ones'
        | 'edit_not_allowed'
        | 'invalid_input'
        | 'server_error'
    }

export type CurrentGuest = {
  id: string
  name: string
  rsvp: RsvpStatus | 'pending'
  email: string | null
  phone: string | null
  guest_message: string | null
  plus_one_adults: number
  plus_one_children: number
  /** ISO timestamp of the most-recent submit. Null = never responded
   *  (created by the host but the guest hasn't clicked yet). The page
   *  uses this to decide whether to gate edits on
   *  `events.allow_rsvp_edit`. */
  responded_at: string | null
}

// Split a free-form contact value into email/phone slots based on the
// presence of '@'. Trim away whitespace; empty string → null on both.
function splitContact(raw: string | undefined): {
  email: string | null
  phone: string | null
} {
  const trimmed = raw?.trim() ?? ''
  if (!trimmed) return { email: null, phone: null }
  if (trimmed.includes('@')) return { email: trimmed, phone: null }
  return { email: null, phone: trimmed }
}

/**
 * Submit (or update) the viewer's RSVP for an event.
 *
 * Two identity paths:
 *   • Authenticated → `guests.claimed_user_id = auth.uid()` (partial-unique
 *     index enforces one row per user/event)
 *   • Anonymous → an httpOnly per-event cookie holds the row's
 *     `invite_token`. First submit mints a token + cookie; subsequent
 *     submits re-use it.
 *
 * Anonymous writes use the service-role client; RLS blocks anon roles from
 * touching `guests` directly. The action validates inputs server-side
 * before any service-role call.
 */
export async function submitRsvp(input: RsvpInput): Promise<SubmitRsvpResult> {
  // ─── 1. Cheap input shape validation (event-specific gates run later) ─
  const rawName = input.name?.trim() ?? ''
  if (rawName.length > 100) {
    return { ok: false, error: 'invalid_input' }
  }
  const message = input.message?.trim() ?? ''
  if (message.length > GUEST_MESSAGE_MAX) {
    return { ok: false, error: 'invalid_input' }
  }
  if (input.status !== 'yes' && input.status !== 'no' && input.status !== 'maybe') {
    return { ok: false, error: 'invalid_input' }
  }
  // Plus-one counts must be non-negative integers. Per-event caps are
  // checked below after the event row is fetched.
  const rawPlusAdults = input.plusOneAdults ?? 0
  const rawPlusChildren = input.plusOneChildren ?? 0
  if (
    !Number.isInteger(rawPlusAdults) ||
    rawPlusAdults < 0 ||
    !Number.isInteger(rawPlusChildren) ||
    rawPlusChildren < 0
  ) {
    return { ok: false, error: 'invalid_input' }
  }

  // ─── 2. Resolve the event + per-event RSVP toggles ────────────────────
  const supabase = await createClient()
  const { data: event } = await supabase
    .from('events')
    .select(
      'id, status, capacity, allow_maybe, require_names, plus_one_enabled, plus_one_max_adults, plus_one_max_children, allow_rsvp_edit',
    )
    .eq('slug', input.eventSlug)
    .maybeSingle()
  if (!event) return { ok: false, error: 'event_not_found' }
  if (event.status !== 'published') {
    return { ok: false, error: 'event_not_published' }
  }

  // ─── Per-event policy enforcement ─────────────────────────────────────
  // Defense-in-depth — the UI already hides the Maybe button and marks the
  // name field optional based on these toggles, but the server is the
  // source of truth.
  if (input.status === 'maybe' && !event.allow_maybe) {
    return { ok: false, error: 'maybe_not_allowed' }
  }
  let name = rawName
  if (name.length === 0) {
    if (event.require_names) return { ok: false, error: 'invalid_input' }
    // require_names = false → server-side anonymous fallback in the
    // viewer's locale. Stored as the literal "Anonymous" (or local
    // equivalent) so the guest list panel reads naturally without sentinel
    // values to decode.
    const tCommon = await getTranslations('rsvp')
    name = tCommon('anonymousFallback')
  }

  // ─── Plus-one cap enforcement ─────────────────────────────────────────
  // Plus-ones only make sense on 'yes'. For 'no'/'maybe' the dialog never
  // sends non-zero counts, but if the client somehow does we coerce to 0
  // rather than rejecting — saving a 'no' shouldn't fail because of a
  // dangling stepper value.
  let plusOneAdults = rawPlusAdults
  let plusOneChildren = rawPlusChildren
  if (input.status !== 'yes') {
    plusOneAdults = 0
    plusOneChildren = 0
  } else if (!event.plus_one_enabled) {
    if (plusOneAdults > 0 || plusOneChildren > 0) {
      return { ok: false, error: 'plus_one_not_allowed' }
    }
  } else {
    if (plusOneAdults > event.plus_one_max_adults) {
      return { ok: false, error: 'too_many_adult_plus_ones' }
    }
    if (plusOneChildren > event.plus_one_max_children) {
      return { ok: false, error: 'too_many_child_plus_ones' }
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const cookieStore = await cookies()
  const cookieName = `${COOKIE_PREFIX}${event.id}`
  const existingToken = cookieStore.get(cookieName)?.value

  const service = createServiceClient()
  const contact = splitContact(input.contact)
  const messageOrNull = message.length > 0 ? message : null
  const locale = await getLocale()

  // ─── 3. Capacity check (yes-only, count-then-insert; documented race) ─
  //
  // Postgres doesn't give us a transactional "atomic insert if count < N"
  // primitive without serializable isolation or an advisory lock. We do a
  // best-effort count beforehand and accept the small race where two
  // simultaneous "going" submits could both pass the check when only one
  // capacity slot remains. Mitigation deferred — if abuse surfaces, swap
  // to `select … for update` on a counter row or an advisory lock keyed by
  // event_id. Documented in CLAUDE.md's "Known race conditions" section.
  if (input.status === 'yes' && event.capacity) {
    // Editing an existing 'yes' row doesn't consume a new slot. Find out
    // whether we already have a row before counting against capacity.
    const existingYesAlreadyCounted = await rowAlreadyCountsAsYes({
      service,
      eventId: event.id,
      user,
      existingToken,
    })
    if (!existingYesAlreadyCounted) {
      const { count: yesCount } = await service
        .from('guests')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', event.id)
        .eq('rsvp', 'yes')
      if ((yesCount ?? 0) >= event.capacity) {
        return { ok: false, error: 'event_full' }
      }
    }
  }

  // ─── 4. Logged-in path ────────────────────────────────────────────────
  if (user) {
    const { data: existing } = await service
      .from('guests')
      .select('id, responded_at')
      .eq('event_id', event.id)
      .eq('claimed_user_id', user.id)
      .maybeSingle()

    if (existing) {
      // Edit-policy gate: a row that's already been responded to (has a
      // non-null `responded_at`) is locked when the host turned
      // `allow_rsvp_edit` off. Re-submits before the first response are
      // still fine — those rows are host-created shells the guest is
      // filling for the first time.
      if (!event.allow_rsvp_edit && existing.responded_at !== null) {
        return { ok: false, error: 'edit_not_allowed' }
      }
      const { error } = await service
        .from('guests')
        .update({
          name,
          email: contact.email,
          phone: contact.phone,
          rsvp: input.status,
          guest_message: messageOrNull,
          plus_one_adults: plusOneAdults,
          plus_one_children: plusOneChildren,
          responded_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
      if (error) return { ok: false, error: 'server_error' }
      revalidatePath(`/${locale}/e/${input.eventSlug}`)
      return { ok: true, guestId: existing.id, status: input.status }
    }

    const token = generateInviteToken()
    const { data: inserted, error } = await service
      .from('guests')
      .insert({
        event_id: event.id,
        claimed_user_id: user.id,
        invite_token: token,
        name,
        email: contact.email,
        phone: contact.phone,
        rsvp: input.status,
        guest_message: messageOrNull,
        plus_one_adults: plusOneAdults,
        plus_one_children: plusOneChildren,
        responded_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    if (error || !inserted) return { ok: false, error: 'server_error' }
    revalidatePath(`/${locale}/e/${input.eventSlug}`)
    return { ok: true, guestId: inserted.id, status: input.status }
  }

  // ─── 5. Anonymous path ────────────────────────────────────────────────
  if (existingToken) {
    const { data: existing } = await service
      .from('guests')
      .select('id, responded_at')
      .eq('event_id', event.id)
      .eq('invite_token', existingToken)
      .is('claimed_user_id', null)
      .maybeSingle()

    if (existing) {
      if (!event.allow_rsvp_edit && existing.responded_at !== null) {
        return { ok: false, error: 'edit_not_allowed' }
      }
      const { error } = await service
        .from('guests')
        .update({
          name,
          email: contact.email,
          phone: contact.phone,
          rsvp: input.status,
          guest_message: messageOrNull,
          plus_one_adults: plusOneAdults,
          plus_one_children: plusOneChildren,
          responded_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
      if (error) return { ok: false, error: 'server_error' }
      revalidatePath(`/${locale}/e/${input.eventSlug}`)
      return { ok: true, guestId: existing.id, status: input.status }
    }
    // Cookie has a token, but no matching row (likely host removed the guest
    // or the cookie was tampered with). Fall through and mint a new identity.
  }

  const token = generateInviteToken()
  const { data: inserted, error } = await service
    .from('guests')
    .insert({
      event_id: event.id,
      claimed_user_id: null,
      invite_token: token,
      name,
      email: contact.email,
      phone: contact.phone,
      rsvp: input.status,
      guest_message: messageOrNull,
      plus_one_adults: plusOneAdults,
      plus_one_children: plusOneChildren,
      responded_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (error || !inserted) return { ok: false, error: 'server_error' }

  cookieStore.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_SEC,
    path: '/',
  })

  revalidatePath(`/${locale}/e/${input.eventSlug}`)
  return { ok: true, guestId: inserted.id, status: input.status }
}

/**
 * Resolve the viewer's existing RSVP row for an event, if any.
 *
 * Used by the public event page to decide between "RSVP" and "Edit RSVP"
 * CTAs. Returns null for both first-time visitors and viewers whose cookie
 * points at a non-existent row (e.g. host removed them).
 */
export async function getCurrentGuestForEvent(
  eventSlug: string,
): Promise<CurrentGuest | null> {
  const supabase = await createClient()
  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('slug', eventSlug)
    .maybeSingle()
  if (!event) return null

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data } = await supabase
      .from('guests')
      .select(
        'id, name, rsvp, email, phone, guest_message, plus_one_adults, plus_one_children, responded_at',
      )
      .eq('event_id', event.id)
      .eq('claimed_user_id', user.id)
      .maybeSingle()
    if (!data) return null
    return {
      id: data.id,
      name: data.name,
      rsvp: data.rsvp as CurrentGuest['rsvp'],
      email: data.email,
      phone: data.phone,
      guest_message: data.guest_message,
      plus_one_adults: data.plus_one_adults,
      plus_one_children: data.plus_one_children,
      responded_at: data.responded_at,
    }
  }

  const cookieStore = await cookies()
  const token = cookieStore.get(`${COOKIE_PREFIX}${event.id}`)?.value
  if (!token) return null

  // Anon RLS blocks SELECT — go through service-role.
  const service = createServiceClient()
  const { data } = await service
    .from('guests')
    .select(
      'id, name, rsvp, email, phone, guest_message, plus_one_adults, plus_one_children, responded_at',
    )
    .eq('event_id', event.id)
    .eq('invite_token', token)
    .is('claimed_user_id', null)
    .maybeSingle()
  if (!data) return null
  return {
    id: data.id,
    name: data.name,
    rsvp: data.rsvp as CurrentGuest['rsvp'],
    email: data.email,
    phone: data.phone,
    guest_message: data.guest_message,
    plus_one_adults: data.plus_one_adults,
    plus_one_children: data.plus_one_children,
    responded_at: data.responded_at,
  }
}

export type RemoveGuestResult =
  | { ok: true }
  | { ok: false; error: 'unauthorized' | 'delete_failed' }

/**
 * Host/co-host removes a guest from their event. RLS enforces who can
 * delete; the action just routes the request and returns clean error codes.
 * The removed guest's cookie still points at the deleted row — next time
 * they RSVP, the cookie is silently overwritten with a fresh identity.
 */
export async function removeGuest(guestId: string): Promise<RemoveGuestResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  const { data: guest } = await supabase
    .from('guests')
    .select('event_id, events!inner(slug)')
    .eq('id', guestId)
    .maybeSingle()

  const { error } = await supabase.from('guests').delete().eq('id', guestId)
  if (error) return { ok: false, error: 'delete_failed' }

  if (guest?.events?.slug) {
    const locale = await getLocale()
    revalidatePath(`/${locale}/events/${guest.events.slug}/edit`)
    revalidatePath(`/${locale}/e/${guest.events.slug}`)
  }
  return { ok: true }
}

// ─── Internal helpers ──────────────────────────────────────────────────────

/**
 * Returns true when the viewer already has a 'yes' RSVP row for this event,
 * meaning a re-submit doesn't consume a new capacity slot. Capacity counts
 * only need to grow when adding a NEW yes — editing yes→yes (or yes→no→yes
 * within the same row) shouldn't trip the cap.
 */
async function rowAlreadyCountsAsYes({
  service,
  eventId,
  user,
  existingToken,
}: {
  service: ReturnType<typeof createServiceClient>
  eventId: string
  user: { id: string } | null
  existingToken: string | undefined
}): Promise<boolean> {
  if (user) {
    const { data } = await service
      .from('guests')
      .select('rsvp')
      .eq('event_id', eventId)
      .eq('claimed_user_id', user.id)
      .maybeSingle()
    return data?.rsvp === 'yes'
  }
  if (!existingToken) return false
  const { data } = await service
    .from('guests')
    .select('rsvp')
    .eq('event_id', eventId)
    .eq('invite_token', existingToken)
    .is('claimed_user_id', null)
    .maybeSingle()
  return data?.rsvp === 'yes'
}
