'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { sendMagicLink, type MagicLinkState } from './actions'

const initialState: MagicLinkState = { status: 'idle' }

export function LoginForm() {
  const t = useTranslations('auth.login')
  const [state, formAction, pending] = useActionState(
    sendMagicLink,
    initialState,
  )

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="w-full space-y-4">
      <form action={formAction} className="space-y-3">
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
