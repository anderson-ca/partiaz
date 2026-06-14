import Image from 'next/image'
import { getLocale } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { createClient } from '@/lib/supabase/server'

// Server Component. Auth-aware icon logo:
//   - logged in  → purple mark, links to the user's home (/events)
//   - logged out → white mark, links to the locale root (marketing home)
// Variant + href are computed server-side, so there's no hydration flash of
// the wrong mark or destination. `className` is forwarded to the image so each
// surface controls its own sizing.
export async function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  const locale = await getLocale()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <Link
      href={user ? '/events' : '/'}
      locale={locale}
      className="inline-flex shrink-0 transition-opacity hover:opacity-80"
    >
      <Image
        src={user ? '/logo-purple.png' : '/logo-white.png'}
        alt="PartiAZ"
        width={2000}
        height={2000}
        priority
        className={className}
      />
    </Link>
  )
}
