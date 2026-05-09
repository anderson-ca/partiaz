'use client'

import { useParams } from 'next/navigation'
import { LogIn } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/routing'

// Renders a "Sign in" link that preserves the current path as `?next=...`
// so the user lands back here after auth.
export function SignInLink() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const params = useParams()

  // Build the locale-prefixed `next` path. usePathname() strips the locale,
  // so we re-add it. Drop dynamic-segment placeholders with their values.
  let resolved = pathname
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      resolved = resolved.replace(`[${key}]`, value)
    }
  }
  const nextParam = `/${locale}${resolved === '/' ? '' : resolved}`

  return (
    <Link
      href={{ pathname: '/login', query: { next: nextParam } }}
      className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-white transition hover:bg-white/10"
    >
      <LogIn className="h-4 w-4" />
      {t('signIn')}
    </Link>
  )
}
