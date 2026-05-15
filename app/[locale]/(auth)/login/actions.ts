'use server'

import { headers } from 'next/headers'
import { isSafeRelativePath } from '@/lib/auth/safe-redirect'
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

  // `next` is a hidden form input set by <LoginForm>. Re-validate here —
  // never trust client form values, even ones we set ourselves.
  const rawNext = formData.get('next')
  const next =
    typeof rawNext === 'string' && isSafeRelativePath(rawNext) ? rawNext : null

  const supabase = await createClient()
  // Prefer the browser's actual `Origin` header (server-side equivalent of
  // `window.location.origin`) so magic links adapt automatically to local
  // dev, production, and Vercel preview deploys without depending on
  // NEXT_PUBLIC_SITE_URL being correct in each environment. Supabase's
  // Redirect URL allowlist is the security boundary that makes this safe.
  // Env-var + localhost fallbacks remain for non-browser request paths.
  const origin =
    (await headers()).get('origin') ??
    process.env.NEXT_PUBLIC_SITE_URL ??
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
