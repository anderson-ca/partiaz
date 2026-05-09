import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'

// Root: authed → dashboard, unauthed → login. We don't render a marketing
// surface here yet (that's its own future prompt); until then, sending
// unauthed visitors straight to /login is the cleaner first impression than
// a bland scaffold.
export default async function HomePage({
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
  redirect(user ? `/${locale}/events` : `/${locale}/login`)
}
