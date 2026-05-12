'use server'

import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { normalizePhone } from '@/lib/phone'

export type SendPhoneOtpResult =
  | { ok: true; phone: string }
  | { ok: false; error: 'invalid_phone' | 'rate_limited' | 'send_failed' }

/**
 * Step 1: send a 6-digit OTP to `rawPhone` via WhatsApp (delivery channel
 * is configured on the Supabase Phone provider, backed by Twilio Verify).
 *
 * The returned `phone` is the E.164-normalized form — clients should keep
 * that around for the subsequent verify step so the two halves of the
 * round-trip use identical strings.
 */
export async function sendPhoneOtp(rawPhone: string): Promise<SendPhoneOtpResult> {
  const phone = normalizePhone(rawPhone)
  if (!phone) return { ok: false, error: 'invalid_phone' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    // `channel` isn't set here — Supabase routes through Twilio Verify
    // which selects WhatsApp (or SMS fallback) based on the Verify Service
    // configuration. The JS SDK passes `channel` through to gotrue, but in
    // current versions the Supabase-side Twilio Verify integration handles
    // channel selection without it.
  })

  if (error) {
    const msg = error.message?.toLowerCase() ?? ''
    if (msg.includes('rate') || msg.includes('too many'))
      return { ok: false, error: 'rate_limited' }
    return { ok: false, error: 'send_failed' }
  }
  return { ok: true, phone }
}

export type VerifyPhoneOtpResult =
  | { ok: true; isNewUser: boolean }
  | {
      ok: false
      error:
        | 'invalid_phone'
        | 'invalid_code'
        | 'expired_code'
        | 'verify_failed'
    }

/**
 * Step 2: verify the OTP. On success Supabase mints a session — the cookie
 * is set automatically by the SSR client used in `createClient()`.
 *
 * `isNewUser` is decided by `profiles.display_name`: phone-only signups
 * leave it NULL after the auth-trigger insert, and the UI then routes to a
 * "What should we call you?" step. Returning users have a name already.
 */
export async function verifyPhoneOtp(
  rawPhone: string,
  token: string,
): Promise<VerifyPhoneOtpResult> {
  const phone = normalizePhone(rawPhone)
  if (!phone) return { ok: false, error: 'invalid_phone' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token: token.trim(),
    // `type: 'sms'` is Supabase's internal naming. It applies to any phone
    // OTP regardless of delivery channel — WhatsApp delivery is opaque to
    // the verify call.
    type: 'sms',
  })

  if (error) {
    const msg = error.message?.toLowerCase() ?? ''
    if (msg.includes('expired')) return { ok: false, error: 'expired_code' }
    if (msg.includes('invalid') || msg.includes('incorrect'))
      return { ok: false, error: 'invalid_code' }
    return { ok: false, error: 'verify_failed' }
  }
  if (!data.user) return { ok: false, error: 'verify_failed' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', data.user.id)
    .maybeSingle()

  // Belt-and-suspenders: keep profiles.phone in sync with auth.users.phone
  // even when the trigger has already set it on insert. Cheap UPSERT.
  if (data.user.phone) {
    await supabase
      .from('profiles')
      .update({ phone: data.user.phone })
      .eq('id', data.user.id)
  }

  const isNewUser = !profile?.display_name
  return { ok: true, isNewUser }
}

export type CompletePhoneSignupResult =
  | { ok: true }
  | { ok: false; error: 'unauthorized' | 'invalid_name' | 'save_failed' }

/**
 * Step 3 (new users only): persist the chosen display name. Called after a
 * successful OTP verify when the user has no existing profile.display_name.
 */
export async function completePhoneSignup(
  displayName: string,
): Promise<CompletePhoneSignupResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  const trimmed = displayName.trim()
  if (trimmed.length < 1 || trimmed.length > 100) {
    return { ok: false, error: 'invalid_name' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: trimmed })
    .eq('id', user.id)

  if (error) return { ok: false, error: 'save_failed' }
  return { ok: true }
}
