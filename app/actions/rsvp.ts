'use server'

import 'server-only'
import { revalidatePath } from 'next/cache'
import { getLocale, getTranslations } from 'next-intl/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export type RsvpStatus = 'yes' | 'no' | 'maybe'

// Free-form guest-to-host note. 280 cap matches the [12b] textarea
// `maxLength` — both client + server enforce the same ceiling.
const GUEST_MESSAGE_MAX = 280

// Strict Zod schema for the RSVP submission payload. The `.strict()` call
// REJECTS unknown keys — a crafted request that tries to slip an `email`
// or `phone` field through gets caught here and bounces as `invalid_input`.
// That's the [12b.3] hardening boundary: guests don't own their own
// contact info anymore, and the server enforces it at the type/parse level.
const rsvpInputSchema = z
  .object({
    eventSlug: z.string().min(1),
    status: z.enum(['yes', 'no', 'maybe']),
    /** Anonymous identity key. Sourced from the `?t=<token>` URL param on
     *  the public event page and threaded through the dialog. Required for
     *  anon submissions; ignored when the viewer has a logged-in session. */
    inviteToken: z.string().min(1).optional(),
    /** Only meaningful when the existing guest row has a null/empty name.
     *  Server discards if the row already has a stored name (host control). */
    name: z.string().max(100).optional(),
    message: z.string().max(GUEST_MESSAGE_MAX).optional(),
    plusOneAdults: z.number().int().min(0).optional(),
    plusOneChildren: z.number().int().min(0).optional(),
  })
  .strict()

export type RsvpInput = z.infer<typeof rsvpInputSchema>

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
        | 'guest_not_found'
        | 'invalid_input'
        | 'server_error'
    }

export type CurrentGuest = {
  id: string
  name: string
  rsvp: RsvpStatus | 'pending'
  guest_message: string | null
  plus_one_adults: number
  plus_one_children: number
  /** ISO timestamp of the most-recent submit. Null = host added but the
   *  guest hasn't clicked yet. Drives the [12a]/[12b] edit-gate. */
  responded_at: string | null
}

/**
 * Submit (or update) the viewer's RSVP for an event.
 *
 * Identity resolution — STRICT, single-source, no fallbacks ([12b.3]):
 *   • Logged-in viewer → `guests.claimed_user_id = auth.uid()`
 *   • Anonymous viewer → `guests.invite_token = input.inviteToken` (the
 *     `?t=<token>` URL param)
 *   • Neither resolves a row → `guest_not_found`. The action NEVER inserts
 *     a new row; the host is the only party that creates guests
 *     (`addGuest` / `addGuestsBatch` in `app/actions/guests.ts`).
 *
 * What the action writes:
 *   • rsvp, guest_message, plus_one_adults, plus_one_children, responded_at
 *   • name, ONLY when the existing row's name was empty (host left it
 *     blank for a phone/email-only contact). Once set, never overwritten.
 *
 * What the action NEVER writes:
 *   • email, phone — host-controlled, immutable from the guest side
 *
 * Anonymous writes use the service-role client; RLS blocks anon from
 * touching `guests` directly. The Zod parse is the type/security boundary
 * for what the guest is allowed to send.
 */
export async function submitRsvp(input: RsvpInput): Promise<SubmitRsvpResult> {
  // ─── 1. Schema-level validation (`.strict()` bounces unknown keys) ────
  const parsed = rsvpInputSchema.safeParse(input)
  if (!parsed.success) {
    console.error('[submitRsvp] returning invalid_input', {
      reason: 'schema_violation',
      issues: parsed.error.issues,
    })
    return { ok: false, error: 'invalid_input' }
  }
  const data = parsed.data

  const trimmedName = (data.name ?? '').trim()
  const trimmedMessage = (data.message ?? '').trim()
  const rawPlusAdults = data.plusOneAdults ?? 0
  const rawPlusChildren = data.plusOneChildren ?? 0

  console.log('[submitRsvp] start', {
    eventSlug: data.eventSlug,
    status: data.status,
    hasInviteToken: !!data.inviteToken,
    hasName: trimmedName.length > 0,
    plusOneAdults: rawPlusAdults,
    plusOneChildren: rawPlusChildren,
    messageLength: trimmedMessage.length,
  })

  // ─── 2. Resolve the event + per-event RSVP toggles ────────────────────
  const supabase = await createClient()
  const { data: event } = await supabase
    .from('events')
    .select(
      'id, status, capacity, allow_maybe, require_names, plus_one_enabled, plus_one_max_adults, plus_one_max_children, allow_rsvp_edit',
    )
    .eq('slug', data.eventSlug)
    .maybeSingle()
  if (!event) {
    console.error('[submitRsvp] returning event_not_found', {
      eventSlug: data.eventSlug,
    })
    return { ok: false, error: 'event_not_found' }
  }
  if (event.status !== 'published') {
    console.error('[submitRsvp] returning event_not_published', {
      eventSlug: data.eventSlug,
      status: event.status,
    })
    return { ok: false, error: 'event_not_published' }
  }
  if (data.status === 'maybe' && !event.allow_maybe) {
    console.error('[submitRsvp] returning maybe_not_allowed', {
      eventId: event.id,
    })
    return { ok: false, error: 'maybe_not_allowed' }
  }

  // ─── 3. Plus-one cap enforcement ──────────────────────────────────────
  // Plus-ones only apply to 'yes'. For 'no'/'maybe' we coerce to 0 rather
  // than rejecting — a leftover stepper value shouldn't fail an otherwise
  // valid submission.
  let plusOneAdults = rawPlusAdults
  let plusOneChildren = rawPlusChildren
  if (data.status !== 'yes') {
    plusOneAdults = 0
    plusOneChildren = 0
  } else if (!event.plus_one_enabled) {
    if (plusOneAdults > 0 || plusOneChildren > 0) {
      console.error('[submitRsvp] returning plus_one_not_allowed', {
        plusOneAdults,
        plusOneChildren,
        eventEnabled: event.plus_one_enabled,
      })
      return { ok: false, error: 'plus_one_not_allowed' }
    }
  } else {
    if (plusOneAdults > event.plus_one_max_adults) {
      console.error('[submitRsvp] returning too_many_adult_plus_ones', {
        requested: plusOneAdults,
        max: event.plus_one_max_adults,
      })
      return { ok: false, error: 'too_many_adult_plus_ones' }
    }
    if (plusOneChildren > event.plus_one_max_children) {
      console.error('[submitRsvp] returning too_many_child_plus_ones', {
        requested: plusOneChildren,
        max: event.plus_one_max_children,
      })
      return { ok: false, error: 'too_many_child_plus_ones' }
    }
  }

  // ─── 4. Identity resolution ───────────────────────────────────────────
  // Two lookup paths, no fallback, no INSERT branch.
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const service = createServiceClient()

  console.log('[submitRsvp] lookup', {
    hasInviteToken: !!data.inviteToken,
    hasClaimedUserSession: !!user,
  })

  type ExistingRow = {
    id: string
    name: string | null
    rsvp: string
    responded_at: string | null
  }
  let existing: ExistingRow | null = null

  if (user) {
    const { data: row } = await service
      .from('guests')
      .select('id, name, rsvp, responded_at')
      .eq('event_id', event.id)
      .eq('claimed_user_id', user.id)
      .maybeSingle()
    existing = row as ExistingRow | null
  } else if (data.inviteToken) {
    const { data: row } = await service
      .from('guests')
      .select('id, name, rsvp, responded_at')
      .eq('event_id', event.id)
      .eq('invite_token', data.inviteToken)
      .is('claimed_user_id', null)
      .maybeSingle()
    existing = row as ExistingRow | null
  }

  if (!existing) {
    console.error(
      '[submitRsvp] guest_not_found — token/session lookup failed',
      { hasInviteToken: !!data.inviteToken },
    )
    return { ok: false, error: 'guest_not_found' }
  }

  // ─── 5. Edit-policy gate ──────────────────────────────────────────────
  // A row already responded to (responded_at != null) is locked when the
  // host turned `allow_rsvp_edit` off. Re-submits on an unresponded row
  // (host-created shell) are always fine.
  if (!event.allow_rsvp_edit && existing.responded_at !== null) {
    console.error('[submitRsvp] returning edit_not_allowed', {
      responded_at: existing.responded_at,
    })
    return { ok: false, error: 'edit_not_allowed' }
  }

  // ─── 6. Name resolution ───────────────────────────────────────────────
  // If the stored name is non-empty, KEEP IT. The guest can't rename
  // themselves through this surface — that's a host control. If the
  // stored name is empty (host left it blank on add), we accept the
  // guest's input; if input is also empty, fall back to require_names
  // policy.
  const storedName = existing.name?.trim() ?? ''
  let nameToSet: string | null = null // null = don't touch the column
  if (storedName.length === 0) {
    if (trimmedName.length === 0) {
      if (event.require_names) {
        console.error('[submitRsvp] returning invalid_input', {
          reason: 'name_required_but_empty',
          eventId: event.id,
        })
        return { ok: false, error: 'invalid_input' }
      }
      // require_names = false → server-side anonymous fallback in the
      // viewer's locale.
      const tCommon = await getTranslations('rsvp')
      nameToSet = tCommon('anonymousFallback')
    } else {
      nameToSet = trimmedName
    }
  }

  // ─── 7. Capacity check ────────────────────────────────────────────────
  // Only when changing TO 'yes' from a non-yes state. yes→yes edits don't
  // consume a new slot; non-yes submits don't count at all.
  if (data.status === 'yes' && event.capacity && existing.rsvp !== 'yes') {
    const { count: yesCount } = await service
      .from('guests')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('rsvp', 'yes')
    if ((yesCount ?? 0) >= event.capacity) {
      console.error('[submitRsvp] returning event_full', {
        yesCount,
        capacity: event.capacity,
      })
      return { ok: false, error: 'event_full' }
    }
  }

  // ─── 8. UPDATE — the only write path ──────────────────────────────────
  const updatePayload: {
    rsvp: RsvpStatus
    guest_message: string | null
    plus_one_adults: number
    plus_one_children: number
    responded_at: string
    name?: string
  } = {
    rsvp: data.status,
    guest_message: trimmedMessage.length > 0 ? trimmedMessage : null,
    plus_one_adults: plusOneAdults,
    plus_one_children: plusOneChildren,
    responded_at: new Date().toISOString(),
  }
  if (nameToSet !== null) {
    updatePayload.name = nameToSet
  }

  const { error: updateError } = await service
    .from('guests')
    .update(updatePayload)
    .eq('id', existing.id)

  if (updateError) {
    console.error('[submitRsvp] returning server_error', {
      dbError: updateError,
    })
    return { ok: false, error: 'server_error' }
  }

  const locale = await getLocale()
  revalidatePath(`/${locale}/e/${data.eventSlug}`)
  console.log('[submitRsvp] success', {
    guestId: existing.id,
    status: data.status,
  })
  return { ok: true, guestId: existing.id, status: data.status }
}

/**
 * Resolve the viewer's existing RSVP row for an event, if any.
 *
 * Single identity strategy — matches `submitRsvp`'s lookup order. Logged-in
 * users get their row via `claimed_user_id`; anon visitors must provide
 * the `?t=<token>` URL param (no cookie fallback as of [12b.3]).
 */
export async function getCurrentGuestForEvent(
  eventSlug: string,
  inviteToken: string | undefined,
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
        'id, name, rsvp, guest_message, plus_one_adults, plus_one_children, responded_at',
      )
      .eq('event_id', event.id)
      .eq('claimed_user_id', user.id)
      .maybeSingle()
    if (!data) return null
    return {
      id: data.id,
      name: data.name,
      rsvp: data.rsvp as CurrentGuest['rsvp'],
      guest_message: data.guest_message,
      plus_one_adults: data.plus_one_adults,
      plus_one_children: data.plus_one_children,
      responded_at: data.responded_at,
    }
  }

  if (!inviteToken) return null

  // Anon RLS blocks SELECT — go through service-role.
  const service = createServiceClient()
  const { data } = await service
    .from('guests')
    .select(
      'id, name, rsvp, guest_message, plus_one_adults, plus_one_children, responded_at',
    )
    .eq('event_id', event.id)
    .eq('invite_token', inviteToken)
    .is('claimed_user_id', null)
    .maybeSingle()
  if (!data) return null
  return {
    id: data.id,
    name: data.name,
    rsvp: data.rsvp as CurrentGuest['rsvp'],
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
