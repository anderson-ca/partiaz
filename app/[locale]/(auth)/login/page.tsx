import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { isSafeRelativePath } from '@/lib/auth/safe-redirect'
import { createClient } from '@/lib/supabase/server'
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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-4 py-12">
      <header className="space-y-1 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">parti.az</h1>
        <p className="text-sm text-muted-foreground">{t('title')}</p>
      </header>
      <LoginForm next={next} />
    </main>
  )
}
