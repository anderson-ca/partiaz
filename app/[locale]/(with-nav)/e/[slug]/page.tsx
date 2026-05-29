import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import type { ISourceOptions } from '@tsparticles/engine'
import {
  EventPageRender,
  type EventPageEvent,
} from '@/components/event/EventPageRender'
import { getGuestSummary } from '@/app/actions/guest-summary'
import { getCurrentGuestForEvent } from '@/app/actions/rsvp'
import { getEventForView } from '@/lib/event-fetch'
import { resizeCoverUrl } from '@/lib/cover-url'
import { getSiteUrl } from '@/lib/site-url'
import type { ThemeBackgroundValue } from '@/lib/schemas/theme'
import { createClient } from '@/lib/supabase/server'

type EventAudience = 'private' | 'public_profile'

// ─── OG metadata ───────────────────────────────────────────────────────────

const OG_LOCALE_MAP: Record<string, string> = {
  az: 'az_AZ',
  ru: 'ru_RU',
  en: 'en_US',
}

// Canonical URL is the locale-less /e/{slug} form — matches what's actually
// shared in SMS templates. Middleware redirects to the locale-prefixed
// path; crawlers / preview bots follow that hop transparently.
function canonicalUrl(slug: string) {
  return `${getSiteUrl()}/e/${slug}`
}

// Pick an OG image URL. Videos can't render as OG images and there's no
// poster column yet, so .mp4 covers fall back to the default placeholder.
// Image URLs from Supabase Storage and Unsplash are already absolute.
function pickOgImage(coverUrl: string | null): {
  url: string
  isDefault: boolean
} {
  if (!coverUrl || /\.mp4(\?|$)/i.test(coverUrl)) {
    return { url: `${getSiteUrl()}/og-default.png`, isDefault: true }
  }
  // [perf-1] right-size Unsplash sources to the 1200×630 OG card so social
  // crawlers don't pull a 1760-px upstream. Non-Unsplash URLs pass through.
  return { url: resizeCoverUrl(coverUrl, 'og'), isDefault: false }
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return s.slice(0, max - 1).trimEnd() + '…'
}

const INVITED_YOU_TO: Record<string, (host: string, title: string) => string> = {
  az: (h, t) => `${h} sizi ${t} tədbirinə dəvət etdi.`,
  ru: (h, t) => `${h} приглашает вас на ${t}.`,
  en: (h, t) => `${h} invited you to ${t}.`,
}
const INVITED_YOU_MINIMAL: Record<string, (host: string) => string> = {
  az: (h) => `${h} sizi dəvət etdi.`,
  ru: (h) => `${h} приглашает вас.`,
  en: (h) => `${h} invited you.`,
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<{ t?: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { t: inviteToken } = await searchParams
  const result = await getEventForView(slug, inviteToken)
  const event = result?.event

  // Fallback metadata when the slug doesn't resolve. Keeps the page's
  // notFound() rendering intact while still giving the crawler something
  // benign.
  if (!event || !event.host) {
    return {
      title: 'PartiAZ',
      openGraph: {
        title: 'PartiAZ',
        siteName: 'PartiAZ',
        type: 'website',
        url: canonicalUrl(slug),
        images: [
          {
            url: `${getSiteUrl()}/og-default.png`,
            width: 1200,
            height: 630,
          },
        ],
      },
      robots: { index: false, follow: false },
    }
  }

  const hostName = event.host.display_name?.trim() || 'PartiAZ'
  const hostLocaleRaw = event.host.locale ?? 'az'
  const hostLocale =
    hostLocaleRaw === 'ru' || hostLocaleRaw === 'en' ? hostLocaleRaw : 'az'
  const ogLocale = OG_LOCALE_MAP[hostLocale] ?? 'az_AZ'

  // `status === 'published'` is the gate for full details. Drafts (and
  // canceled events) get the minimal description so unpublished work
  // doesn't leak via preview cards.
  const isPublished = event.status === 'published'

  let description: string
  if (isPublished) {
    const invited = INVITED_YOU_TO[hostLocale](hostName, event.title)
    const dateStr = event.starts_at
      ? new Intl.DateTimeFormat(hostLocale, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(event.starts_at))
      : null
    const pieces = [invited, dateStr, event.location_text].filter(
      (s): s is string => !!s,
    )
    description = truncate(pieces.join(' · '), 200)
  } else {
    description = INVITED_YOU_MINIMAL[hostLocale](hostName)
  }

  const og = pickOgImage(event.cover_image_url)
  const ogImages = og.isDefault
    ? [{ url: og.url, width: 1200, height: 630 }]
    : [{ url: og.url }]

  return {
    title: event.title,
    description,
    openGraph: {
      title: event.title,
      description,
      siteName: 'PartiAZ',
      type: 'website',
      url: canonicalUrl(event.slug),
      locale: ogLocale,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description,
      images: ogImages.map((i) => i.url),
    },
    robots: { index: false, follow: false },
  }
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default async function PublicEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<{ t?: string }>
}) {
  const { locale, slug } = await params
  const { t: inviteToken } = await searchParams
  setRequestLocale(locale)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Cached fetch — shared with generateMetadata via React `cache()` so this
  // is a single DB roundtrip per request. Two-stage anon-RLS + token-bearer
  // fallback lives inside the helper now.
  const result = await getEventForView(slug, inviteToken)
  const event = result?.event ?? null
  // True when the page resolved via the `?t=<invite-token>` bearer path
  // (see [11c.7.2]). A token-bearer is, by definition, an invited guest —
  // so they should NOT be treated as restricted on a private event.
  const isTokenAuth = result?.isTokenAuth ?? false

  if (!event || !event.theme || !event.font_preset || !event.host) {
    notFound()
  }

  const isHost = !!user && user.id === event.host.id
  const isCohost =
    !!user && (event.cohosts ?? []).some((c) => c.user_id === user.id)
  const isPublished = event.status === 'published'
  const audience = (event.audience ?? 'private') as EventAudience
  // Restricted access: private event + viewer is none of (host, cohost,
  // token-bearer). Cohosts and token-bearers are both invited parties —
  // cohosts via the host's explicit add, token-bearers via possession of
  // the 24-char nanoid — and should see the full event, not the locked
  // stub. Token branch fixed in [12b.1]; cohost branch added in [bug-fix-1].
  const restricted =
    audience === 'private' && !isHost && !isCohost && !isTokenAuth

  // ─── RSVP data ─────────────────────────────────────────────────────────
  // Skip the cookie/lookup work when the event isn't open for RSVPs (draft).
  // The guest summary still runs because hosts viewing their draft like to
  // see the counts; but for drafts there are typically no rows anyway.
  const [currentGuest, guestSummary, viewerProfile] = await Promise.all([
    isPublished
      ? getCurrentGuestForEvent(slug, inviteToken)
      : Promise.resolve(null),
    getGuestSummary(event.id, !!event.show_guest_names),
    user
      ? supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .maybeSingle()
          .then((r) => r.data)
      : Promise.resolve(null),
  ])

  // Flatten the joined event_cohosts shape into [{ display_name, avatar }]
  // for the HostBlock component. Drop rows where the profile FK didn't
  // resolve (theoretically impossible given the ON DELETE CASCADE chain,
  // but defensive).
  const cohostsForRender = (event.cohosts ?? [])
    .filter((c) => c.profile)
    .map((c) => ({
      user_id: c.user_id,
      display_name: c.profile!.display_name ?? 'Anonymous',
      avatar_url: c.profile!.avatar_url,
    }))

  const renderedEvent: EventPageEvent = {
    id: event.id,
    slug: event.slug,
    title: event.title,
    status: event.status,
    audience,
    theme: {
      background_type: event.theme.background_type as ThemeBackgroundValue['type'],
      background_value: event.theme.background_value as ThemeBackgroundValue,
    },
    effect: event.effect
      ? {
          id: event.effect.id,
          name: event.effect.name,
          engine: event.effect.engine === 'tsparticles' ? 'tsparticles' : 'css',
          config: event.effect.config as ISourceOptions,
        }
      : null,
    font_preset: {
      font_family: event.font_preset.font_family,
      font_weight: event.font_preset.font_weight,
      letter_spacing: event.font_preset.letter_spacing,
      text_transform: event.font_preset.text_transform,
    },
    text_color: event.text_color,
    cover_image_url: event.cover_image_url,
    cover_overlay_enabled: event.cover_overlay_enabled,
    cover_overlay_text: event.cover_overlay_text,
    overlay_font: event.overlay_font
      ? {
          font_family: event.overlay_font.font_family,
          font_weight: event.overlay_font.font_weight,
          letter_spacing: event.overlay_font.letter_spacing,
          text_transform: event.overlay_font.text_transform,
        }
      : null,
    cover_overlay_color: event.cover_overlay_color,
    starts_at: event.starts_at,
    ends_at: event.ends_at,
    location_text: event.location_text,
    location_address: event.location_address,
    location_hidden_until_rsvp: event.location_hidden_until_rsvp,
    description: event.description,
    host: {
      id: event.host.id,
      display_name: event.host.display_name,
      avatar_url: event.host.avatar_url,
    },
    cohosts: cohostsForRender,
    show_guest_count: !!event.show_guest_count,
    show_guest_names: !!event.show_guest_names,
    allow_maybe: event.allow_maybe ?? true,
    require_names: event.require_names ?? true,
    allow_rsvp_edit: event.allow_rsvp_edit ?? true,
    plus_one_enabled: event.plus_one_enabled ?? false,
    plus_one_max_adults: event.plus_one_max_adults ?? 1,
    plus_one_max_children: event.plus_one_max_children ?? 0,
  }

  return (
    <EventPageRender
      event={renderedEvent}
      locale={locale}
      viewer={{
        isHost,
        isCohost,
        isTokenAuth,
        viewerDisplayName: viewerProfile?.display_name ?? undefined,
      }}
      restricted={restricted}
      currentGuest={currentGuest}
      guestSummary={guestSummary}
    />
  )
}
