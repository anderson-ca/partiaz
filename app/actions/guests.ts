'use server'

import 'server-only'
import { revalidatePath } from 'next/cache'
import { getLocale } from 'next-intl/server'
import { buildInviteSmsBody } from '@/lib/invite-sms-body'
import { generateInviteToken } from '@/lib/invite-token'
import { normalizePhone } from '@/lib/phone'
import { sendEmail } from '@/lib/resend'
import { getSiteUrl } from '@/lib/site-url'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { inviteEmail } from '@/lib/templates/invite-email'
import { type Locale } from '@/lib/templates/invite-sms'
import { sendSms } from '@/lib/twilio'

const PG_UNIQUE_VIOLATION = '23505'

// Permissive on purpose — we want to flag obviously-bad input ("not-an-email")
// while accepting the long tail of valid-but-unusual addresses (+aliases,
// subdomains, IDN). Full RFC 5322 isn't worth the regex weight.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type AddGuestInput = {
  name?: string
  phone?: string
  email?: string
}

export type AddedGuest = {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  rsvp: 'pending' | 'yes' | 'no' | 'maybe'
}

export type AddGuestResult =
  | { ok: true; guest: AddedGuest }
  | {
      ok: false
      error:
        | 'unauthorized'
        | 'phone_or_email_required'
        | 'invalid_phone'
        | 'invalid_email'
        | 'duplicate_phone'
        | 'duplicate_email'
        | 'insert_failed'
    }

/**
 * Host or co-host adds a guest to their event manually. Anon writes on
 * `guests` are denied by RLS; we go through the service-role client after a
 * code-side auth check using the `is_event_host_or_cohost` RPC (added in
 * [09.85]) — same pattern as the [10] RSVP submit flow.
 */
export async function addGuest(
  eventId: string,
  input: AddGuestInput,
): Promise<AddGuestResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  const { data: isMember, error: rpcErr } = await supabase.rpc(
    'is_event_host_or_cohost',
    { p_event_id: eventId },
  )
  if (rpcErr || !isMember) return { ok: false, error: 'unauthorized' }

  // ─── Input shape: at least one contact channel required ───────────────
  const rawName = input.name?.trim() ?? ''
  const rawPhone = input.phone?.trim() ?? ''
  const rawEmail = input.email?.trim() ?? ''
  if (!rawPhone && !rawEmail) {
    return { ok: false, error: 'phone_or_email_required' }
  }

  let normalizedPhone: string | null = null
  if (rawPhone) {
    normalizedPhone = normalizePhone(rawPhone)
    if (!normalizedPhone) return { ok: false, error: 'invalid_phone' }
  }

  let cleanEmail: string | null = null
  if (rawEmail) {
    if (!EMAIL_REGEX.test(rawEmail)) {
      return { ok: false, error: 'invalid_email' }
    }
    cleanEmail = rawEmail.toLowerCase()
  }

  // ─── Insert via service-role (anon RLS denies; INSERT policy requires
  //      claimed_user_id = auth.uid(), but host-added guests are
  //      claimed_user_id = NULL by definition until the actual person
  //      RSVPs as themselves) ──────────────────────────────────────────────
  const service = createServiceClient()
  const token = generateInviteToken()

  const { data: inserted, error } = await service
    .from('guests')
    .insert({
      event_id: eventId,
      name: rawName,
      phone: normalizedPhone,
      email: cleanEmail,
      invite_token: token,
      rsvp: 'pending',
    })
    .select('id, name, phone, email, rsvp')
    .single()

  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION) {
      // Disambiguate by constraint name embedded in the message. Falling
      // through to insert_failed for unknown constraints (e.g. an
      // invite_token collision, which is vanishingly rare with a 24-char
      // nanoid) keeps us honest rather than mis-labelling.
      const msg = error.message ?? ''
      if (msg.includes('guests_event_id_phone_unique')) {
        return { ok: false, error: 'duplicate_phone' }
      }
      if (msg.includes('guests_event_id_email_unique')) {
        return { ok: false, error: 'duplicate_email' }
      }
    }
    return { ok: false, error: 'insert_failed' }
  }

  const locale = await getLocale()
  // Revalidate both surfaces that show this guest list.
  revalidatePath(`/${locale}/events`)
  return {
    ok: true,
    guest: {
      id: inserted.id,
      name: inserted.name || null,
      phone: inserted.phone,
      email: inserted.email,
      rsvp: inserted.rsvp as AddedGuest['rsvp'],
    },
  }
}

export type BatchInsertResult =
  | { ok: true; added: number; skipped: number }
  | {
      ok: false
      error:
        | 'unauthorized'
        | 'no_valid_input'
        | 'concurrent_modification'
        | 'insert_failed'
    }

/**
 * Bulk variant of `addGuest`. The contacts-picker and smart-paste flows
 * funnel here; the single-add form still uses `addGuest`.
 *
 * Dedupe strategy: pre-fetch existing `(phone, email)` for this event in two
 * narrow SELECTs (one per column, both filtered to the values we're about
 * to insert), filter the input client-side, then issue one bulk INSERT.
 * Avoids `ON CONFLICT DO NOTHING` because PG can target only one constraint
 * at a time and we have two (phone + email partial uniques from [11a]/
 * [11a.1]). Also avoids a per-row loop's N round-trips.
 *
 * Race window: a co-host could insert a colliding row between our SELECT
 * and INSERT. The bulk INSERT is all-or-nothing, so a single late collider
 * aborts the whole batch — we surface that as `concurrent_modification` so
 * the host can retry rather than silently losing the batch.
 *
 * Invalid input (unnormalizable phone, bad-shape email, no contact channel)
 * is silently dropped in the loop below — the client review screen already
 * gave the host a chance to fix or remove those rows, so we trust whatever
 * we get and just count valid landings.
 */
export async function addGuestsBatch(
  eventId: string,
  guests: AddGuestInput[],
): Promise<BatchInsertResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  const { data: isMember, error: rpcErr } = await supabase.rpc(
    'is_event_host_or_cohost',
    { p_event_id: eventId },
  )
  if (rpcErr || !isMember) return { ok: false, error: 'unauthorized' }

  // ─── Validate + normalize each input. Drop rows the client somehow
  //      let through that we can't act on. ─────────────────────────────────
  type Row = {
    event_id: string
    name: string
    phone: string | null
    email: string | null
    invite_token: string
    rsvp: 'pending'
  }

  const candidates: Row[] = []
  for (const input of guests) {
    const rawName = input.name?.trim() ?? ''
    const rawPhone = input.phone?.trim() ?? ''
    const rawEmail = input.email?.trim() ?? ''
    if (!rawPhone && !rawEmail) continue

    let phone: string | null = null
    if (rawPhone) {
      phone = normalizePhone(rawPhone)
      if (!phone) continue
    }

    let email: string | null = null
    if (rawEmail) {
      if (!EMAIL_REGEX.test(rawEmail)) continue
      email = rawEmail.toLowerCase()
    }

    candidates.push({
      event_id: eventId,
      name: rawName,
      phone,
      email,
      invite_token: generateInviteToken(),
      rsvp: 'pending',
    })
  }

  if (candidates.length === 0) {
    return { ok: false, error: 'no_valid_input' }
  }

  // ─── Pre-fetch existing duplicates within this event. Two narrow queries
  //      (one per column) beats one wide OR query for readability and
  //      keeps the index hits clean. ─────────────────────────────────────
  const service = createServiceClient()
  const phonesToCheck = candidates
    .map((c) => c.phone)
    .filter((p): p is string => !!p)
  const emailsToCheck = candidates
    .map((c) => c.email)
    .filter((e): e is string => !!e)

  const existingPhones = new Set<string>()
  const existingEmails = new Set<string>()

  if (phonesToCheck.length > 0) {
    const { data } = await service
      .from('guests')
      .select('phone')
      .eq('event_id', eventId)
      .in('phone', phonesToCheck)
    for (const row of data ?? []) {
      if (row.phone) existingPhones.add(row.phone)
    }
  }
  if (emailsToCheck.length > 0) {
    const { data } = await service
      .from('guests')
      .select('email')
      .eq('event_id', eventId)
      .in('email', emailsToCheck)
    for (const row of data ?? []) {
      if (row.email) existingEmails.add(row.email)
    }
  }

  // Dedupe vs. DB AND within the batch itself (two rows with the same phone
  // in one paste). First occurrence wins.
  const seenPhones = new Set<string>()
  const seenEmails = new Set<string>()
  const toInsert: Row[] = []
  for (const row of candidates) {
    if (row.phone && (existingPhones.has(row.phone) || seenPhones.has(row.phone))) {
      continue
    }
    if (row.email && (existingEmails.has(row.email) || seenEmails.has(row.email))) {
      continue
    }
    if (row.phone) seenPhones.add(row.phone)
    if (row.email) seenEmails.add(row.email)
    toInsert.push(row)
  }

  const skipped = candidates.length - toInsert.length
  const locale = await getLocale()

  if (toInsert.length === 0) {
    revalidatePath(`/${locale}/events`)
    return { ok: true, added: 0, skipped }
  }

  const { error: insertErr } = await service.from('guests').insert(toInsert)

  if (insertErr) {
    if (insertErr.code === PG_UNIQUE_VIOLATION) {
      // Race: a concurrent insert (co-host?) landed a colliding row between
      // our SELECT and INSERT. Bulk INSERT is atomic so the whole batch
      // rolled back; ask the host to retry.
      return { ok: false, error: 'concurrent_modification' }
    }
    return { ok: false, error: 'insert_failed' }
  }

  revalidatePath(`/${locale}/events`)
  return { ok: true, added: toInsert.length, skipped }
}

export type DeleteGuestResult =
  | { ok: true }
  | { ok: false; error: 'unauthorized' | 'delete_failed' }

/**
 * Host or co-host removes a guest. RLS (`guests_host_or_self_delete` from
 * [10]) would already permit this via the regular client, but we keep the
 * pattern consistent with addGuest — explicit membership check then
 * service-role delete so error codes stay clean.
 */
export async function deleteGuest(
  eventId: string,
  guestId: string,
): Promise<DeleteGuestResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  const { data: isMember, error: rpcErr } = await supabase.rpc(
    'is_event_host_or_cohost',
    { p_event_id: eventId },
  )
  if (rpcErr || !isMember) return { ok: false, error: 'unauthorized' }

  const service = createServiceClient()
  const { error } = await service
    .from('guests')
    .delete()
    .eq('id', guestId)
    .eq('event_id', eventId)
  if (error) return { ok: false, error: 'delete_failed' }

  const locale = await getLocale()
  revalidatePath(`/${locale}/events`)
  return { ok: true }
}

export type SentChannel = 'sms' | 'email'

export type SendInvitesResult = {
  sent: Array<{ guestId: string; channel: SentChannel }>
  failed: Array<{ guestId: string; reason: string }>
}

/**
 * Send invite SMS / email to a list of guests for one event.
 *
 * Channel selection (per guest):
 *   - phone only          → SMS
 *   - email only          → email
 *   - both                → SMS (AZ market priority + delivery speed)
 *   - neither             → fail that guest with 'no_channel'
 *
 * Iterates SEQUENTIALLY — Twilio's Messaging Service has per-second rate
 * limits and a sequential loop keeps us well under them without a token
 * bucket. On success we stamp `invited_at = now()` + `invite_channel`
 * via service-role; failures leave the row untouched so the host can retry.
 *
 * Twilio Messaging credentials (Account SID + Auth Token + Messaging
 * Service SID) are distinct from the Twilio Verify Service used for OTP
 * sign-in. They live in TWILIO_ACCOUNT_SID/_AUTH_TOKEN/_MESSAGING_SERVICE_SID
 * here, NOT in the Supabase Auth Verify config.
 */
export async function sendInvites(
  eventId: string,
  guestIds: string[],
  overrideChannel?: SentChannel,
): Promise<SendInvitesResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return {
      sent: [],
      failed: guestIds.map((id) => ({ guestId: id, reason: 'unauthorized' })),
    }
  }

  const { data: isMember, error: rpcErr } = await supabase.rpc(
    'is_event_host_or_cohost',
    { p_event_id: eventId },
  )
  if (rpcErr || !isMember) {
    return {
      sent: [],
      failed: guestIds.map((id) => ({ guestId: id, reason: 'unauthorized' })),
    }
  }

  if (guestIds.length === 0) {
    return { sent: [], failed: [] }
  }

  // ─── Fetch event with host profile join. `host_id` (not `created_by`)
  //      is the FK into `profiles`; the next-intl-aligned `locale` column
  //      (not `preferred_locale`) is what drives template language. ──────
  const service = createServiceClient()
  const { data: event, error: eventErr } = await service
    .from('events')
    .select(
      'id, slug, title, cover_image_url, starts_at, location_text, host:profiles!events_host_id_fkey(display_name, locale)',
    )
    .eq('id', eventId)
    .maybeSingle()

  if (eventErr || !event || !event.host) {
    return {
      sent: [],
      failed: guestIds.map((id) => ({ guestId: id, reason: 'event_not_found' })),
    }
  }

  const host = event.host as { display_name: string | null; locale: string }
  const locale = (host.locale === 'ru' || host.locale === 'en' ? host.locale : 'az') as Locale
  const hostName = host.display_name?.trim() || 'parti.az'

  // ─── Fetch the requested guests, restricted to this event. Tampering
  //      with `guestIds` to target someone else's guests would just match
  //      zero rows here. ────────────────────────────────────────────────
  const { data: guests, error: guestsErr } = await service
    .from('guests')
    .select('id, name, phone, email')
    .eq('event_id', eventId)
    .in('id', guestIds)

  if (guestsErr || !guests) {
    return {
      sent: [],
      failed: guestIds.map((id) => ({ guestId: id, reason: 'fetch_failed' })),
    }
  }

  const siteUrl = getSiteUrl()
  const sent: SendInvitesResult['sent'] = []
  const failed: SendInvitesResult['failed'] = []
  const foundIds = new Set(guests.map((g) => g.id))

  // Any guestId the caller passed that didn't come back from the fetch
  // (wrong event, deleted, etc.) is reported individually rather than
  // silently dropped.
  for (const id of guestIds) {
    if (!foundIds.has(id)) {
      failed.push({ guestId: id, reason: 'not_found' })
    }
  }

  // ─── Sequential loop. ──────────────────────────────────────────────────
  for (const guest of guests) {
    const { id: guestId, name, phone, email } = guest

    // Fresh invite token per send: lets us rotate access if a list was
    // ever leaked. The existing token from the row would also work.
    const { data: refreshed } = await service
      .from('guests')
      .select('invite_token')
      .eq('id', guestId)
      .maybeSingle()
    const token = refreshed?.invite_token
    if (!token) {
      failed.push({ guestId, reason: 'no_token' })
      continue
    }
    const inviteUrl = `${siteUrl}/e/${event.slug}?t=${token}`

    // Channel rule. `overrideChannel` (when provided by the per-guest UI)
    // forces a specific channel; otherwise auto-rule picks SMS when phone
    // exists, email when only email exists, fails when neither.
    let channel: SentChannel
    if (overrideChannel === 'sms') {
      if (!phone) {
        failed.push({ guestId, reason: 'no_phone' })
        continue
      }
      channel = 'sms'
    } else if (overrideChannel === 'email') {
      if (!email) {
        failed.push({ guestId, reason: 'no_email' })
        continue
      }
      channel = 'email'
    } else {
      const useSms = !!phone
      const useEmail = !useSms && !!email
      if (!useSms && !useEmail) {
        failed.push({ guestId, reason: 'no_channel' })
        continue
      }
      channel = useSms ? 'sms' : 'email'
    }

    let sendResult: { ok: true } | { ok: false; error: string }

    if (channel === 'sms') {
      const body = await buildInviteSmsBody({
        locale,
        hostName,
        eventTitle: event.title,
        eventStartsAt: event.starts_at ? new Date(event.starts_at) : null,
        inviteUrl,
      })
      const r = await sendSms({ to: phone!, body })
      sendResult = r.ok ? { ok: true } : { ok: false, error: r.error }
    } else {
      const { subject, html } = inviteEmail({
        locale,
        eventTitle: event.title,
        eventCoverUrl: event.cover_image_url,
        eventStartsAt: event.starts_at ? new Date(event.starts_at) : null,
        eventLocationText: event.location_text,
        guestName: name,
        inviteUrl,
        hostName,
      })
      const r = await sendEmail({ to: email!, subject, html })
      sendResult = r.ok ? { ok: true } : { ok: false, error: r.error }
    }

    if (!sendResult.ok) {
      failed.push({ guestId, reason: sendResult.error })
      continue
    }

    const { error: updateErr } = await service
      .from('guests')
      .update({
        invited_at: new Date().toISOString(),
        invite_channel: channel,
      })
      .eq('id', guestId)
      .eq('event_id', eventId)

    if (updateErr) {
      // Send succeeded but bookkeeping didn't — log to failed so the host
      // sees something went wrong, but the recipient already got the
      // message. Acceptable trade-off; a retry would double-send.
      failed.push({ guestId, reason: `sent_but_unrecorded:${updateErr.message}` })
      continue
    }

    sent.push({ guestId, channel })
  }

  const reqLocale = await getLocale()
  revalidatePath(`/${reqLocale}/events`)
  return { sent, failed }
}
