import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { routing } from '@/i18n/routing'

type Locale = (typeof routing.locales)[number]

function isLocale(value: string | undefined): value is Locale {
  return !!value && (routing.locales as readonly string[]).includes(value)
}

function detectLocale(request: NextRequest, nextParam: string | null): Locale {
  // 1. Locale embedded in `next` (e.g. /az/events)
  if (nextParam) {
    const segments = nextParam.split('/').filter(Boolean)
    if (isLocale(segments[0])) return segments[0]
  }

  // 2. Accept-Language header
  const accept = request.headers.get('accept-language') ?? ''
  for (const tag of accept.split(',')) {
    const code = tag.trim().split(/[-;]/)[0]
    if (isLocale(code)) return code
  }

  // 3. Default
  return routing.defaultLocale
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next')
  const locale = detectLocale(request, nextParam)

  if (!code) {
    return NextResponse.redirect(`${origin}/${locale}/login?error=oauth_failed`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/${locale}/login?error=oauth_failed`)
  }

  // If `next` is a safe relative path, honor it; else default to /<locale>/events.
  const target =
    nextParam && nextParam.startsWith('/') ? nextParam : `/${locale}/events`
  return NextResponse.redirect(`${origin}${target}`)
}
