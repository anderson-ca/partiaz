'use client'

import { useTransition } from 'react'
import { LogOut, Settings as SettingsIcon } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { signOut } from '@/app/actions/auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FLOATING_SURFACE } from '@/lib/ui/floating-surface'
import { cn } from '@/lib/utils'

type UserMenuProps = {
  displayName: string | null
  avatarUrl: string | null
  userId: string
  email: string | null
}

// Pick a deterministic gradient for fallback avatars based on the user's
// uuid first character. Keeps avatars stable across renders without needing
// a hash function.
const FALLBACK_GRADIENTS = [
  'from-fuchsia-400 to-violet-600',
  'from-cyan-400 to-blue-600',
  'from-amber-400 to-orange-600',
  'from-emerald-400 to-teal-600',
  'from-rose-400 to-pink-600',
  'from-indigo-400 to-purple-600',
] as const

function gradientFor(userId: string): string {
  const idx = userId.charCodeAt(0) % FALLBACK_GRADIENTS.length
  return FALLBACK_GRADIENTS[idx]
}

export function UserMenu({
  displayName,
  avatarUrl,
  userId,
  email,
}: UserMenuProps) {
  const t = useTranslations('nav')
  const locale = useLocale()
  const [pending, startTransition] = useTransition()

  const initial = (displayName ?? email ?? 'U').slice(0, 1).toUpperCase()
  const gradient = gradientFor(userId)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={displayName ?? 'Account'}
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full ring-1 ring-white/15 transition-all duration-150 hover:ring-white/30 active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40"
        >
          {avatarUrl ? (
            // Avatar URLs come from arbitrary providers (Google, manual
            // upload) and aren't all in our remotePatterns whitelist.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span
              className={cn(
                'flex h-full w-full items-center justify-center bg-linear-to-br text-sm font-semibold text-white',
                gradient,
              )}
            >
              {initial}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className={cn(FLOATING_SURFACE, 'min-w-56 rounded-xl p-1')}
      >
        <DropdownMenuLabel className="px-2 py-1.5 text-white">
          <div className="text-sm font-medium leading-tight">
            {displayName ?? 'Anonymous'}
          </div>
          {email && (
            <div className="mt-0.5 truncate text-xs text-white/60">
              {email}
            </div>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            toast(t('settingsComingSoon'))
          }}
          className="gap-2 rounded-lg px-2 py-1.5 text-sm text-white focus:bg-white/10 focus:text-white"
        >
          <SettingsIcon className="h-4 w-4" />
          {t('settings')}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem
          disabled={pending}
          onSelect={(e) => {
            e.preventDefault()
            startTransition(() => {
              signOut(locale)
            })
          }}
          className="gap-2 rounded-lg px-2 py-1.5 text-sm text-rose-300 focus:bg-rose-500/10 focus:text-rose-200"
        >
          <LogOut className="h-4 w-4" />
          {t('signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
