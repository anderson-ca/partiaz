import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoginForm } from './login-form'

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    redirect(`/${locale}/events`)
  }

  const t = await getTranslations('auth.login')

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-4 py-12">
      <header className="space-y-1 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">parti.az</h1>
        <p className="text-sm text-muted-foreground">{t('title')}</p>
      </header>
      <LoginForm />
    </main>
  )
}
