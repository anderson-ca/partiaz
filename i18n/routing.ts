import { createNavigation } from 'next-intl/navigation'
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['az', 'ru', 'en'],
  defaultLocale: 'az',
})

// Locale-aware navigation helpers. Client-side hooks (`useRouter`,
// `usePathname`) auto-strip / re-apply the locale prefix when navigating —
// e.g. `router.replace(pathname, { locale: 'ru' })` on `/en/events/new`
// goes to `/ru/events/new` without losing the rest of the URL.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
