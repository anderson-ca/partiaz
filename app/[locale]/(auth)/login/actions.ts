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
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (await headers()).get('origin') ??
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
