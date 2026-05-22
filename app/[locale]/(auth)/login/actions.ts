'use server'

import { headers } from 'next/headers'
import { isSafeRelativePath } from '@/lib/auth/safe-redirect'
import {
  checkLimit,
  magicLinkEmailLimiter,
  magicLinkIpLimiter,
} from '@/lib/ratelimit'
import { magicLinkSchema } from '@/lib/schemas/auth'
import { createClient } from '@/lib/supabase/server'

export type MagicLinkState =
  | { status: 'idle' }
  | { status: 'sent' }
  | { status: 'error'; error: string }

export async function sendMagicLink(
  _prev: MagicLinkState,
  formData: FormData,
): Promise<MagicLinkState> {
  const parsed = magicLinkSchema.safeParse({
    email: String(formData.get('email') ?? '').trim(),
  })

  if (!parsed.success) {
    return { status: 'error', error: 'invalidEmail' }
  }

  // ─── Rate limit ([sec-2]) ─────────────────────────────────────────────
  // Unauthenticated endpoint → key by email (per-account spam) AND IP
  // (the "30 different emails from one bot" case where no individual
  // email tripping its limit would block the burst).
  //
  // Local dev: x-forwarded-for is unset, so the fallback 'unknown'
  // means all local traffic shares one bucket. Production via Vercel
  // sets the header correctly.
  const reqHeaders = await headers()
  const ip =
    reqHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const emailKey = parsed.data.email.toLowerCase()

  const emailRl = await checkLimit(magicLinkEmailLimiter, emailKey)
  if (!emailRl.ok) return { status: 'error', error: 'rateLimited' }
  const ipRl = await checkLimit(magicLinkIpLimiter, ip)
  if (!ipRl.ok) return { status: 'error', error: 'rateLimited' }

  // `next` is a hidden form input set by <LoginForm>. Re-validate here —
  // never trust client form values, even ones we set ourselves.
  const rawNext = formData.get('next')
  const next =
    typeof rawNext === 'string' && isSafeRelativePath(rawNext) ? rawNext : null

  const supabase = await createClient()
  // Prefer the browser's actual `Origin` header (server-side equivalent of
  // `window.location.origin`) so magic links adapt automatically to local
  // dev, production, and Vercel preview deploys without depending on
  // SITE_URL being correct in each environment. Supabase's Redirect URL
  // allowlist is the security boundary that makes this safe. Env-var +
  // localhost fallbacks remain for non-browser request paths. `SITE_URL`
  // is non-public on purpose — see [11c.7.1] / lib/site-url.ts for why.
  const origin =
    reqHeaders.get('origin') ??
    process.env.SITE_URL ??
    'http://localhost:3000'

  const callbackUrl = next
    ? `${origin}/auth/callback?next=${encodeURIComponent(next)}`
    : `${origin}/auth/callback`

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: callbackUrl },
  })

  if (error) {
    return { status: 'error', error: 'sendFailed' }
  }

  return { status: 'sent' }
}
