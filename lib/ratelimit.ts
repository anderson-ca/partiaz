import 'server-only'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Reads UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN from env.
// Non-public on purpose (server-only). Provisioning is documented in
// `.env.example`; production set via Vercel project env config.
const redis = Redis.fromEnv()

// Sliding-window limiters per endpoint. Sliding-window (vs fixed-window)
// avoids burst-at-window-boundary issues where a user could send 2x the
// allotment by timing requests across a window edge.
//
// `analytics: false` on every limiter — analytics writes additional Redis
// ops per check, and we're on free-tier budget. Flip per-limiter when a
// specific surface needs metrics.

// ── Invite blast (Twilio SMS + Resend email, same counter) ───────────────
// Event-level: prevents repeated blasts to the same guest list.
// Host-level: prevents a malicious host from spreading the same load
// across many events.
//
// The cost vector is real money per Twilio send; both limiters must pass
// before any send begins.
export const inviteEventLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  prefix: 'rl:invites:event',
  analytics: false,
})

export const inviteHostLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '24 h'),
  prefix: 'rl:invites:host',
  analytics: false,
})

// ── Guest list mutations ─────────────────────────────────────────────────
// Batch upload is the dominant population path for the SMS-blast vector
// — a host who somehow bypasses this could still hit the invite limiter
// downstream, but defense in depth here keeps the guest list itself
// bounded.
export const guestBatchLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix: 'rl:guests:batch',
  analytics: false,
})

export const guestAddLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 h'),
  prefix: 'rl:guests:add',
  analytics: false,
})

// ── Secondary endpoints ([sec-3]) ────────────────────────────────────────
// RSVP submit: 10/h per guest is well above any legitimate edit loop
// (host flipping Yes/Maybe/No a few times) but catches a script flapping
// capacity counts.
export const rsvpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix: 'rl:rsvp',
  analytics: false,
})

// Event creation: 10/h per user is far above any human cadence; catches
// automation without ever bothering a real user. Slug space is 6 char
// base56 (~30B) — exhausting it is impractical, but this is cheap
// defense-in-depth on top of the slug-collision retry loop.
export const createEventLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix: 'rl:event:create',
  analytics: false,
})

// ── Auth: magic link (unauthenticated, IP + email keyed) ─────────────────
// Two-axis: per-email caps individual-account spam; per-IP caps the
// "30 different emails from one bot" case where no individual email
// would trip its own limit.
export const magicLinkEmailLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  prefix: 'rl:auth:magic:email',
  analytics: false,
})

export const magicLinkIpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 h'),
  prefix: 'rl:auth:magic:ip',
  analytics: false,
})

/**
 * Check a limiter for an identifier. Fails OPEN — if Redis is
 * unreachable, log + allow. For a consumer event app pre-launch,
 * denying real users during a Redis incident is worse than letting
 * some bypass through during an outage. A financial-platform context
 * would invert this (fail closed); for us, the trade-off favors
 * availability.
 */
export async function checkLimit(
  limiter: Ratelimit,
  identifier: string,
): Promise<{ ok: true } | { ok: false; retryAfter: number }> {
  try {
    const { success, reset } = await limiter.limit(identifier)
    if (success) return { ok: true }
    return {
      ok: false,
      retryAfter: Math.max(0, Math.ceil((reset - Date.now()) / 1000)),
    }
  } catch (err) {
    console.error('[ratelimit] redis unreachable, failing open', err)
    return { ok: true }
  }
}
