import { AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { PhoneAuthForm } from '@/components/auth/PhoneAuthForm'
import { LocaleSwitcher } from '@/components/navigation/LocaleSwitcher'
import { Logo } from '@/components/navigation/Logo'
import { isSafeRelativePath } from '@/lib/auth/safe-redirect'
import { FLOATING_SURFACE } from '@/lib/ui/floating-surface'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { LoginForm } from './login-form'

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const { locale } = await params
  const { next: rawNext, error: rawError } = await searchParams
  setRequestLocale(locale)

  // Sanitize the redirect target before plumbing it through to the magic
  // link / OAuth callbacks. Anything not a safe relative path becomes null —
  // protocol-relative `//evil.com/...` and friends never reach the user.
  const next = isSafeRelativePath(rawNext) ? rawNext : null

  // OAuth callback failures bounce here with ?error=oauth_failed. Only that
  // single code is emitted today (see app/auth/callback/route.ts).
  const oauthFailed = rawError === 'oauth_failed'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    // Already authenticated: skip the form and honor `next` directly if it's
    // safe. Otherwise fall back to /events.
    redirect(next ?? `/${locale}/events`)
  }

  const tPage = await getTranslations('auth.loginPage')

  return (
    <div className="flex min-h-screen flex-col">
      {/* The (auth) route group has no global navbar, so the login page brings
          its own. Matches the marketing nav's visual contract (h-16, max-w-6xl,
          px gutters) but static/transparent — login isn't a scroll hero, so the
          scroll-transform treatment LandingNav uses isn't warranted here. */}
      <header>
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <Logo />
          <LocaleSwitcher />
        </nav>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div
          className={cn(
            FLOATING_SURFACE,
            'w-full max-w-md rounded-2xl p-8 md:p-10',
          )}
        >
          <header className="mb-6 text-center">
            <Image
              src="/logo-white.png"
              alt=""
              width={2000}
              height={2000}
              priority
              className="mx-auto mb-3 h-14 w-14"
            />
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              PartiAZ
            </h1>
            <p className="mt-2 text-base text-foreground-muted">
              {tPage('tagline')}
            </p>
          </header>

          {/* OAuth callback failure surfacing. Rose-tinted alert reads as
              "previous attempt failed; try again below" — sits between the
              hero and the methods so it's the next thing scanned. Rose
              literals are consistent with the existing errorGeneric
              pattern; a --color-error-* semantic token can land in a
              future prompt. */}
          {oauthFailed && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{tPage('errors.oauthFailed')}</span>
            </div>
          )}

          {/* Phone is the primary auth method for AZ — most users have
              WhatsApp and OTP is faster than email round-trip. Promoted to
              the top of the card; email + Google sit below the divider as
              secondary options. */}
          <PhoneAuthForm next={next} />

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-xs uppercase tracking-wide text-foreground-faint">
              {tPage('orDivider')}
            </span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <LoginForm next={next} />
        </div>
      </main>
    </div>
  )
}
