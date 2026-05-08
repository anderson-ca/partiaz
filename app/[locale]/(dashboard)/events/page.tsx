import Link from 'next/link'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { signOut } from './actions'

export default async function EventsPage({
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
  if (!user) {
    redirect(`/${locale}/login`)
  }

  const t = await getTranslations('auth')
  const signOutWithLocale = signOut.bind(null, locale)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-6 px-4 py-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t('greeting', { email: user.email ?? '' })}
      </h1>
      <form action={signOutWithLocale}>
        <Button type="submit" variant="outline">
          {t('signOut')}
        </Button>
      </form>
      <Link
        href={`/${locale}/dev/themes`}
        className="text-xs text-muted-foreground underline-offset-4 hover:underline"
      >
        Theme catalog
      </Link>
    </main>
  )
}
