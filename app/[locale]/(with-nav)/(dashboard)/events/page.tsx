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

  // Single auth call already happened; both fetches now run concurrently.
  const [{ data: profile }, { data: rawEvents }] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single(),
    supabase
      .from('events')
      .select(
        `id, slug, title, status, text_color, cover_image_url,
         theme:themes(background_type, background_value),
         font_preset:font_presets(font_family, font_weight, letter_spacing, text_transform)`,
      )
      .eq('host_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  // Cast to our expected shape; Supabase's generated types lose the literal
  // unions on text-with-CHECK columns (status, background_type).
  const events: EventCardEvent[] = (rawEvents ?? [])
    .filter((e) => e.theme && e.font_preset)
    .map((e) => ({
      id: e.id,
      slug: e.slug,
      title: e.title || t('cardStatusDraft'),
      status: e.status as EventCardEvent['status'],
      text_color: e.text_color,
      cover_image_url: e.cover_image_url,
      theme: {
        background_type: e.theme!
          .background_type as ThemeBackgroundValue['type'],
        background_value: e.theme!.background_value as ThemeBackgroundValue,
      },
      font_preset: e.font_preset!,
    }))

  const hosting = events
  // Upcoming (today) = published; date-based filtering lands when starts_at
  // wires up in Prompt 08.1.
  const upcoming = events.filter((e) => e.status === 'published')

  const counts = {
    upcoming: upcoming.length,
    hosting: hosting.length,
    past: 0,
  }

  // Pre-render the cards on the server so EventTabs (Client Component) can
  // pass them as children without becoming async itself.
  const upcomingCards =
    upcoming.length > 0
      ? upcoming.map((e) => (
          <EventCard
            key={e.id}
            event={e}
            isHost={true}
            locale={locale}
          />
        ))
      : null
  const hostingCards =
    hosting.length > 0
      ? hosting.map((e) => (
          <EventCard
            key={e.id}
            event={e}
            isHost={true}
            locale={locale}
          />
        ))
      : null

  const firstName =
    profile?.display_name?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'there'

  return (
    <>
      {/* Fixed gradient covers the entire viewport, including the area
          UNDER the sticky navbar (z-40). Without this, the navbar's
          backdrop-blur mixes with the body's white background and reads
          as a flat gray strip. With it, the blur picks up the violet/
          indigo and the navbar fades naturally into the gradient. */}
      <div className="fixed inset-0 -z-10 bg-linear-to-br from-violet-950 via-indigo-950 to-zinc-950" />

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
        <header className="mb-8 md:mb-12">
          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
            {t('welcomeBack', { name: firstName })}
          </h1>
          <p className="mt-2 text-lg text-white/60">
            {t('eventsCount', { count: events.length })}
          </p>
        </header>

        <EventTabs
          counts={counts}
          upcomingCards={upcomingCards}
          hostingCards={hostingCards}
          newEventTile={<NewEventTile locale={locale} />}
          locale={locale}
        />
      </div>
    </>
  )
}
