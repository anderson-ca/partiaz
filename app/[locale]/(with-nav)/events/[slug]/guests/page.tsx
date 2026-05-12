import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AddGuestForm } from '@/components/guests/AddGuestForm'
import { GuestList, type GuestListItem } from '@/components/guests/GuestList'
import { createClient } from '@/lib/supabase/server'

export default async function GuestsPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/${locale}/login?next=/${locale}/events/${slug}/guests`)
  }

  const { data: event, error } = await supabase
    .from('events')
    .select('id, slug, title, host_id')
    .eq('slug', slug)
    .maybeSingle()
  if (error || !event) notFound()

  // Same access gate as the editor page — primary host or co-host only.
  const isHost = event.host_id === user.id
  let isCohost = false
  if (!isHost) {
    const { data: cohostRow } = await supabase
      .from('event_cohosts')
      .select('user_id')
      .eq('event_id', event.id)
      .eq('user_id', user.id)
      .maybeSingle()
    isCohost = !!cohostRow
  }
  if (!isHost && !isCohost) notFound()

  const { data: guestsData } = await supabase
    .from('guests')
    .select('id, name, phone, email, rsvp')
    .eq('event_id', event.id)
    .order('created_at', { ascending: false })

  const guests = (guestsData ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    phone: g.phone,
    email: g.email,
    rsvp: g.rsvp as GuestListItem['rsvp'],
  }))

  const t = await getTranslations('events.guests')

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 md:px-8">
      <header className="space-y-2">
        <Link
          href={`/${locale}/events/${slug}/edit`}
          className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t('backToEditor')}
        </Link>
        <h1 className="text-2xl font-semibold text-white">{t('title')}</h1>
        <p className="text-sm text-white/60">
          {t('subtitle', { event: event.title })}
        </p>
      </header>

      <AddGuestForm eventId={event.id} />
      <GuestList eventId={event.id} guests={guests} />
    </div>
  )
}
