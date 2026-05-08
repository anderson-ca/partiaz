'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
        <div className="space-y-1.5">
          <Label htmlFor="email">{t('emailLabel')}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={t('emailPlaceholder')}
            autoComplete="email"
            required
            disabled={state.status === 'sent'}
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
          <p className="text-sm text-muted-foreground">{t('checkEmail')}</p>
        )}
        {state.status === 'error' && (
          <p className="text-sm text-destructive">{t('errorGeneric')}</p>
        )}
      </form>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>{t('or')}</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogle}
      >
        {t('googleButton')}
      </Button>
    </div>
  )
}
