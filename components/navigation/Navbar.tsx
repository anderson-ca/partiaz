import { createClient } from '@/lib/supabase/server'
import { NAV_SURFACE } from '@/lib/ui/floating-surface'
import { cn } from '@/lib/utils'
import { HelpButton } from './HelpButton'
import { LocaleSwitcher } from './LocaleSwitcher'
import { Logo } from './Logo'
import { NotificationBell } from './NotificationBell'
import { SignInLink } from './SignInLink'
import { UserMenu } from './UserMenu'

// Server Component. Fetches user + profile so the navbar renders the right
// avatar / sign-in state on first paint without a client roundtrip.
//
// Mounted exclusively from app/[locale]/(with-nav)/layout.tsx — the
// `(auth)` route group has no parent navbar, so the login page renders
// chrome-free.

export async function Navbar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: { display_name: string | null; avatar_url: string | null } | null =
    null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', user.id)
      .single()
    profile = data ?? null
  }

  return (
    <header className={cn('sticky top-0 z-40', NAV_SURFACE)}>
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Logo />
        <div className="flex items-center gap-1 md:gap-2">
          <LocaleSwitcher />
          <HelpButton className="hidden md:inline-flex" />
          {user && <NotificationBell className="hidden md:inline-flex" />}
          {user ? (
            <UserMenu
              displayName={profile?.display_name ?? null}
              avatarUrl={profile?.avatar_url ?? null}
              userId={user.id}
              email={user.email ?? null}
            />
          ) : (
            <SignInLink />
          )}
        </div>
      </nav>
    </header>
  )
}
