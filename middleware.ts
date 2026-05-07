import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from './i18n/routing'
import { updateSession } from './lib/supabase/middleware'

const intl = createIntlMiddleware(routing)

export async function middleware(request: NextRequest) {
  // /auth/* (OAuth callback) is locale-less. Skip next-intl, only refresh session.
  if (request.nextUrl.pathname.startsWith('/auth')) {
    return updateSession(request, NextResponse.next({ request }))
  }

  const intlResponse = intl(request)
  return updateSession(request, intlResponse)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
