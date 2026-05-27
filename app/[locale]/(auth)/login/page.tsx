import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { PhoneAuthForm } from '@/components/auth/PhoneAuthForm'
import { LocaleSwitcher } from '@/components/navigation/LocaleSwitcher'
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
  searchParams: Promise<{ next?: string }>
}) {
  const { locale } = await params
  const { next: rawNext } = await searchParams
  setRequestLocale(locale)

  // Sanitize the redirect target before plumbing it through to the magic
  // link / OAuth callbacks. Anything not a safe relative path becomes null —
  // protocol-relative `//evil.com/...` and friends never reach the user.
  const next = isSafeRelativePath(rawNext) ? rawNext : null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    // Already authenticated: skip the form and honor `next` directly if it's
    // safe. Otherwise fall back to /events.
    redirect(next ?? `/${locale}/events`)
  }

  const t = await getTranslations('auth.login')
  const tPage = await getTranslations('auth.loginPage')

  return (
    <div className="relative min-h-screen">
      {/* LocaleSwitcher floats top-right outside the card so users can flip
          languages without committing to the form. The (auth) route group
          has no global navbar, so we mount the switcher inline here. */}
      <div className="absolute top-4 right-4 z-10">
        <LocaleSwitcher />
      </div>

      <main className="flex min-h-screen items-center justify-center px-4 py-12">
        <div
          className={cn(
            FLOATING_SURFACE,
            'w-full max-w-md rounded-2xl p-8 md:p-10',
          )}
        >
          <header className="mb-6">
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              parti.az
            </h1>
            <p className="mt-1 text-sm text-white/60">{t('title')}</p>
          </header>

          {/* Phone is the primary auth method for AZ — most users have
              WhatsApp and OTP is faster than email round-trip. Promoted to
              the top of the card; email + Google sit below the divider as
              secondary options. */}
          <PhoneAuthForm next={next} />

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-xs uppercase tracking-wide text-white/40">
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
