import { getLocale } from 'next-intl/server'
import { Link } from '@/i18n/routing'

// Server Component. Wordmark + link to the user's "home" route. Once 09.7
// lands a real homepage, point Link to that route.
export async function Logo() {
  const locale = await getLocale()
  return (
    <Link
      href="/events"
      locale={locale}
      className="text-lg font-semibold tracking-tight text-white transition-opacity hover:opacity-80"
    >
      PartiAZ
    </Link>
  )
}
