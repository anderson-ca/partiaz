import { redirect } from 'next/navigation'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import {
  EventCard,
  type EventCardEvent,
} from '@/components/event/EventCard'
import { NewEventTile } from '@/components/event/NewEventTile'
import { EventTabs } from '@/components/dashboard/EventTabs'
import type { ThemeBackgroundValue } from '@/lib/schemas/theme'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/${locale}/login?next=/${locale}/events`)
  }

  const t = await getTranslations('dashboard')

  // Three fetches in parallel: profile (for the welcome name), owned events,
  // and co-hosting events (joined via an INNER on event_cohosts so the same
  // events row arrives flagged with the membership).
  const EVENT_COLUMNS = `id, slug, title, status, host_id, text_color, cover_image_url, starts_at,
       theme:themes(background_type, background_value),
       font_preset:font_presets!events_font_preset_id_fkey(font_family, font_weight, letter_spacing, text_transform)`

  const [{ data: profile }, { data: ownedEvents }, { data: cohostedEvents }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single(),
      supabase
        .from('events')
        .select(EVENT_COLUMNS)
        .eq('host_id', user.id)
        .order('starts_at', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('events')
        .select(
          `${EVENT_COLUMNS}, event_cohosts!inner(user_id)`,
        )
        .eq('event_cohosts.user_id', user.id)
        .neq('host_id', user.id)
        .order('starts_at', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false }),
    ])

  // Cast to our expected shape; Supabase's generated types lose the literal
  // unions on text-with-CHECK columns (status, background_type). Tag each
  // row with `isCohosting` so the EventCard can swap the hosting badge.
  const toEventCard = (
    e: NonNullable<typeof ownedEvents>[number] & { isCohosting?: boolean },
    isCohosting: boolean,
  ): EventCardEvent => ({
    id: e.id,
    slug: e.slug,
    title: e.title || t('cardStatusDraft'),
    status: e.status as EventCardEvent['status'],
    text_color: e.text_color,
    cover_image_url: e.cover_image_url,
    starts_at: e.starts_at,
    isCohosting,
    theme: {
      background_type: e.theme!.background_type as ThemeBackgroundValue['type'],
      background_value: e.theme!.background_value as ThemeBackgroundValue,
    },
    font_preset: e.font_preset!,
  })

  const events: EventCardEvent[] = [
    ...(ownedEvents ?? [])
      .filter((e) => e.theme && e.font_preset)
      .map((e) => toEventCard(e, false)),
    ...(cohostedEvents ?? [])
      .filter((e) => e.theme && e.font_preset)
      .map((e) => toEventCard(e, true)),
  ]

  const now = Date.now()
  const hosting = events
  // Upcoming = published + a future start. Drafts without dates and
  // dateless-anything stay out of Upcoming (they're visible in Hosting).
  const upcoming = events.filter(
    (e) =>
      e.status === 'published' &&
      e.starts_at !== null &&
      new Date(e.starts_at).getTime() >= now,
  )
  // Past = anything with a start in the past, regardless of status — a draft
  // whose date already slipped still belongs here so the host can recover it.
  const past = events.filter(
    (e) => e.starts_at !== null && new Date(e.starts_at).getTime() < now,
  )

  const counts = {
    upcoming: upcoming.length,
    hosting: hosting.length,
    past: past.length,
  }

  // Pre-render the cards on the server so EventTabs (Client Component) can
  // pass them as children without becoming async itself.
  const renderCards = (list: EventCardEvent[]) =>
    list.length > 0
      ? list.map((e) => (
          <EventCard key={e.id} event={e} isHost={true} locale={locale} />
        ))
      : null
  const upcomingCards = renderCards(upcoming)
  const hostingCards = renderCards(hosting)
  const pastCards = renderCards(past)

  // First name resolution, defensive: an empty-string display_name (e.g. a
  // phone signup that bailed before the "what should we call you?" step)
  // shouldn't render as "Welcome, !". The `||` chain treats empty strings
  // as falsy and falls through. When nothing resolves to a real name we
  // switch to the no-name greeting variant instead of plugging "there" in.
  const firstName =
    profile?.display_name?.trim().split(' ')[0] ||
    user.email?.split('@')[0] ||
    null
  const greeting = firstName
    ? t('welcomeWithName', { name: firstName })
    : t('welcomeNoName')

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
        <header className="mb-8 md:mb-12">
          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
            {greeting}
          </h1>
          <p className="mt-2 text-lg text-white/60">
            {t('eventsCount', { count: events.length })}
          </p>
        </header>

        <EventTabs
          counts={counts}
          upcomingCards={upcomingCards}
          hostingCards={hostingCards}
          pastCards={pastCards}
          newEventTile={<NewEventTile locale={locale} />}
          locale={locale}
        />
      </div>
    </>
  )
}
