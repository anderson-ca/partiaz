'use server'

import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Sign the current user out and redirect to the locale-prefixed login page.
 * Caller passes the active locale because Server Actions don't have access
 * to the URL params.
 */
export async function signOut(locale: string) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect(`/${locale}/login`)
}
