'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { sendMagicLink, type MagicLinkState } from './actions'

const initialState: MagicLinkState = { status: 'idle' }

type LoginFormProps = {
  /** Sanitized post-sign-in redirect target. Already validated by the
   *  page-level Server Component via `isSafeRelativePath`. */
  next: string | null
}

export function LoginForm({ next }: LoginFormProps) {
  const t = useTranslations('auth.login')
  const [state, formAction, pending] = useActionState(
    sendMagicLink,
    initialState,
  )

  async function handleGoogle() {
    const supabase = createClient()
    const callbackUrl = next
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      : `${window.location.origin}/auth/callback`
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl },
    })
  }

  return (
    <div className="w-full space-y-4">
      <form action={formAction} className="space-y-3">
        {/* Hidden field threads `next` into FormData → Server Action →
            emailRedirectTo. The action re-validates with isSafeRelativePath
            so a hostile DOM tweak between render and submit can't poison the
            redirect target. */}
        {next && <input type="hidden" name="next" value={next} />}
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-white/80"
          >
            {t('emailLabel')}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder={t('emailPlaceholder')}
            autoComplete="email"
            required
            disabled={state.status === 'sent'}
            className="block w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-400/40 disabled:opacity-50"
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={pending || state.status === 'sent'}
        >
          {t('magicLinkButton')}
        </Button>
        {state.status === 'sent' && (
          <p className="mt-3 text-sm text-emerald-400">{t('checkEmail')}</p>
        )}
        {state.status === 'error' && (
          <p className="mt-3 text-sm text-rose-400">{t('errorGeneric')}</p>
        )}
      </form>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-xs uppercase tracking-wide text-white/40">
          {t('or')}
        </span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2 border-white/20 bg-transparent text-white hover:bg-white/5 hover:text-white"
        onClick={handleGoogle}
      >
        <GoogleGIcon />
        {t('googleButton')}
      </Button>
    </div>
  )
}

// Multi-color Google "G" mark. lucide-react doesn't ship brand icons, so
// inlining a small SVG is the cleanest path. Sized 16x16 to match the
// shadcn Button's default text height.
function GoogleGIcon() {
  return (
    <svg
      viewBox="0 0 18 18"
      className="h-4 w-4"
      aria-hidden="true"
      role="img"
    >
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  )
}
