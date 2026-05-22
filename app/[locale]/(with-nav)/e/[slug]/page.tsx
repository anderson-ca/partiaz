import Link from 'next/link'
import { notFound } from 'next/navigation'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Calendar, Crown, Lock, MapPin, Pencil } from 'lucide-react'
import type { Metadata } from 'next'
import type { ISourceOptions } from '@tsparticles/engine'
import { CoverImage } from '@/components/event/CoverImage'
import { EventTitle } from '@/components/event/EventTitle'
import { LazyEffectOverlay as EffectOverlay } from '@/components/event/LazyEffectOverlay'
import { RestrictedAccessCard } from '@/components/event/RestrictedAccessCard'
import { RsvpCta } from '@/components/event/RsvpCta'
import { ThemeBackground } from '@/components/event/ThemeBackground'
import { getGuestSummary } from '@/app/actions/guest-summary'
import { getCurrentGuestForEvent } from '@/app/actions/rsvp'
import { formatLongDate, type AppLocale } from '@/lib/dates'
import { getEventForView } from '@/lib/event-fetch'
import { resizeCoverUrl } from '@/lib/cover-url'
import { getSiteUrl } from '@/lib/site-url'
import { FLOATING_SURFACE } from '@/lib/ui/floating-surface'
import type { ThemeBackgroundValue } from '@/lib/schemas/theme'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

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
      title: 'parti.az',
      openGraph: {
        title: 'parti.az',
        siteName: 'parti.az',
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

  const hostName = event.host.display_name?.trim() || 'parti.az'
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
      siteName: 'parti.az',
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
  const t = await getTranslations('events.public')
  const tFields = await getTranslations('events.fields')
  const tCohosts = await getTranslations('cohosts')
  const tEventLocation = await getTranslations('events.location')

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
  const isDraft = event.status === 'draft'
  const audience = (event.audience ?? 'private') as EventAudience
  // Restricted access: private event + viewer is neither the host nor a
  // token-bearer. A token-bearer is invited (their possession of the
  // 24-char nanoid is the access proof) and should see the RSVP card,
  // not the locked stub — that's the [12b.1] fix.
  const restricted = audience === 'private' && !isHost && !isTokenAuth

  const theme = {
    background_type: event.theme.background_type as ThemeBackgroundValue['type'],
    background_value: event.theme.background_value as ThemeBackgroundValue,
  }

  const hostName = event.host.display_name ?? 'Anonymous'

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

  // Pre-format the "& X" label here where the cohost data is in scope —
  // next-intl validates ICU vars at the `t()` call site, so deferring to
  // the HostBlock with raw template strings would throw.
  const cohostSuffix =
    cohostsForRender.length === 0
      ? null
      : cohostsForRender.length === 1
        ? tCohosts('publicAndOne', { name: cohostsForRender[0].display_name })
        : tCohosts('publicAndMany', { count: cohostsForRender.length })

  // ─── RSVP data ─────────────────────────────────────────────────────────
  // Skip the cookie/lookup work when the event isn't open for RSVPs (draft).
  // The guest summary still runs because hosts viewing their draft like to
  // see the counts; but for drafts there are typically no rows anyway.
  const isPublished = event.status === 'published'

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

  const viewerDisplayName = viewerProfile?.display_name ?? undefined
  const isCohost = cohostsForRender.some((c) => c.user_id === user?.id)
  const canSeeAllGuests = isHost || isCohost

  // Per-event location gating. Hosts/co-hosts always see the address
  // (they need to manage the event); anyone who has RSVP'd 'yes' sees it;
  // otherwise the toggle decides. The placeholder reveals AFTER yes RSVP.
  const canSeeLocation =
    !event.location_hidden_until_rsvp ||
    isHost ||
    isCohost ||
    currentGuest?.rsvp === 'yes'

  return (
    <>
      {/* Layer 0: themed full-bleed background */}
      <ThemeBackground theme={theme} className="fixed inset-0" />

      {/* Layer 1: ambient effect overlay (lazy chunk) */}
      <EffectOverlay
        effect={
          event.effect
            ? {
                id: event.effect.id,
                name: event.effect.name,
                engine:
                  event.effect.engine === 'tsparticles'
                    ? 'tsparticles'
                    : 'css',
                config: event.effect.config as ISourceOptions,
              }
            : null
        }
        className="fixed inset-0"
      />

      {/* Edit FAB — host-only. Sits below the navbar (top-20) so it doesn't
          collide with the navbar's user controls in the top-right corner.
          Mirrors the new Button language (transitions, focus ring, active
          press) without using the Button primitive — the FAB has bespoke
          backdrop styling that doesn't fit the variant palette. */}
      {isHost && (
        <Link
          href={`/${locale}/events/${slug}/edit`}
          aria-label={t('editAriaLabel')}
          className={cn(
            FLOATING_SURFACE,
            'fixed top-20 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full',
            'transition-all duration-150 hover:bg-zinc-800/95 active:scale-[0.95]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40',
          )}
        >
          <Pencil className="h-4 w-4 text-white" />
        </Link>
      )}

      <main className="relative z-20 mx-auto w-full max-w-5xl px-4 pt-16 pb-16 md:px-8 md:pt-12">
        {/* Draft banner — host viewing their own draft */}
        {isHost && isDraft && (
          <div className="mb-6 flex justify-center">
            <div
              className={cn(
                FLOATING_SURFACE,
                'inline-flex max-w-full items-center gap-3 rounded-full px-4 py-2 text-sm',
              )}
            >
              <span className="text-white/80">{t('draftBannerHost')}</span>
              {/* Pill-info CTA — visually echoes Pill but with hover/active
                  states because it's actually clickable. */}
              <Link
                href={`/${locale}/events/${slug}/edit`}
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-violet-500/15 px-2.5 py-1 text-xs font-medium text-violet-300 transition-all duration-150 hover:bg-violet-500/25 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40"
              >
                {t('draftBannerCta')}
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:gap-12">
          {/* LEFT: title + details */}
          <div className="order-2 space-y-6 md:order-1">
            <EventTitle
              text={event.title}
              fontPreset={{
                font_family: event.font_preset.font_family,
                font_weight: event.font_preset.font_weight,
                letter_spacing: event.font_preset.letter_spacing,
                text_transform: event.font_preset.text_transform,
              }}
              textColor={event.text_color}
              className="text-5xl leading-tight tracking-tight md:text-6xl"
            />

            {/* Date row — live when starts_at is set; otherwise the
                placeholder pre-09.84 wording. */}
            {event.starts_at ? (
              <DetailRow icon={<Calendar className="h-4 w-4" />}>
                <div className="leading-tight">
                  <div>
                    {formatLongDate(event.starts_at, locale as AppLocale)}
                  </div>
                  {event.ends_at && (
                    <div className="text-sm text-white/60">
                      {tFields('until')}{' '}
                      {formatLongDate(event.ends_at, locale as AppLocale)}
                    </div>
                  )}
                </div>
              </DetailRow>
            ) : (
              <DetailRow icon={<Calendar className="h-4 w-4" />}>
                {t('dateTbd')}
              </DetailRow>
            )}

            {/* Location row. Three states:
                  • Has address + viewer can see → show inline
                  • Has address + viewer can't see (location_hidden gated
                    and not yet a yes-RSVP) → "shared after RSVP" placeholder
                  • No address set → generic locked placeholder
                Restricted-private viewers (from the old audience model)
                see nothing here. */}
            {restricted ? null : event.location_text || event.location_address ? (
              canSeeLocation ? (
                <DetailRow icon={<MapPin className="h-4 w-4" />}>
                  <div className="leading-tight">
                    {event.location_text && (
                      <div>{event.location_text}</div>
                    )}
                    {event.location_address && (
                      <div className="text-sm text-white/60">
                        {event.location_address}
                      </div>
                    )}
                  </div>
                </DetailRow>
              ) : (
                <DetailRow icon={<Lock className="h-4 w-4" />}>
                  {tEventLocation('hiddenUntilRsvp')}
                </DetailRow>
              )
            ) : (
              <DetailRow icon={<Lock className="h-4 w-4" />}>
                {t('locationLocked')}
              </DetailRow>
            )}

            {/* Free-text description — preserve whitespace, no markdown. */}
            {event.description && (
              <p className="whitespace-pre-wrap text-base text-white/80">
                {event.description}
              </p>
            )}

            <HostBlock
              hostName={hostName}
              hostAvatarUrl={event.host.avatar_url}
              cohosts={cohostsForRender}
              hostedByLabel={t('hostedBy')}
              cohostSuffix={cohostSuffix}
            />
          </div>

          {/* RIGHT: cover + RSVP + guest list */}
          <div className="order-1 space-y-6 md:order-2">
            <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
              {event.cover_image_url ? (
                <CoverImage
                  url={event.cover_image_url}
                  alt={event.title}
                  aspect="1 / 1"
                  priority
                  overlayEnabled={event.cover_overlay_enabled}
                  overlayText={event.cover_overlay_text}
                  overlayFont={event.overlay_font}
                  overlayColor={event.cover_overlay_color}
                />
              ) : (
                <div
                  className="flex w-full items-center justify-center bg-black/30 text-sm text-white/50 backdrop-blur-md"
                  style={{ aspectRatio: '1 / 1' }}
                >
                  {t('noCover')}
                </div>
              )}
            </div>

            {/* RSVP card — real flow as of [10]. Draft events skip this
                entirely; the host already sees the draft banner up top. */}
            {isPublished && !restricted && (
              <div className={cn(FLOATING_SURFACE, 'rounded-2xl p-5')}>
                <h2 className="mb-4 text-center text-sm font-medium text-white/80">
                  {t('rsvpPrompt')}
                </h2>
                <RsvpCta
                  eventSlug={slug}
                  currentGuest={currentGuest}
                  defaultName={viewerDisplayName}
                  allowMaybe={event.allow_maybe ?? true}
                  requireNames={event.require_names ?? true}
                  allowRsvpEdit={event.allow_rsvp_edit ?? true}
                  plusOneEnabled={event.plus_one_enabled ?? false}
                  plusOneMaxAdults={event.plus_one_max_adults ?? 1}
                  plusOneMaxChildren={event.plus_one_max_children ?? 0}
                />
              </div>
            )}

            {restricted ? (
              <RestrictedAccessCard />
            ) : (
              <GuestSummaryBlock
                eventSlug={slug}
                showCount={!!event.show_guest_count}
                showNames={!!event.show_guest_names}
                summary={guestSummary}
                canSeeAllGuests={canSeeAllGuests}
              />
            )}
          </div>
        </div>
      </main>
    </>
  )
}

// ----- Atoms ---------------------------------------------------------------

function DetailRow({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2 text-base text-white/80">
      <span className="mt-1 shrink-0 text-white/60">{icon}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

function HostAvatar({
  name,
  avatarUrl,
}: {
  name: string
  avatarUrl: string | null
}) {
  if (avatarUrl) {
    // Avoid next/image — host avatars come from arbitrary URLs that aren't
    // in remotePatterns. Plain <img> is fine for a 36px element.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        className="h-9 w-9 rounded-full bg-black/20 object-cover ring-1 ring-white/20"
      />
    )
  }
  // Fallback: initials on a colored circle. Color derived from name length
  // so it's stable per-host without hashing.
  const initial = name.slice(0, 1).toUpperCase()
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-fuchsia-400 to-violet-600 text-sm font-semibold text-white ring-1 ring-white/20">
      {initial}
    </span>
  )
}

function HostBlock({
  hostName,
  hostAvatarUrl,
  cohosts,
  hostedByLabel,
  cohostSuffix,
}: {
  hostName: string
  hostAvatarUrl: string | null
  cohosts: Array<{ user_id: string; display_name: string; avatar_url: string | null }>
  hostedByLabel: string
  cohostSuffix: string | null
}) {
  return (
    <div className="flex items-center gap-3">
      <HostAvatar name={hostName} avatarUrl={hostAvatarUrl} />
      <div className="leading-tight">
        <div className="text-xs uppercase tracking-wide text-white/60">
          {hostedByLabel}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-white">
          <Crown className="h-3.5 w-3.5 text-yellow-300" />
          <span>{hostName}</span>
          {cohosts.length > 0 && cohostSuffix && (
            <>
              <div className="flex -space-x-2">
                {cohosts.slice(0, 3).map((ch) => (
                  <SmallAvatar
                    key={ch.user_id}
                    name={ch.display_name}
                    avatarUrl={ch.avatar_url}
                  />
                ))}
              </div>
              <span className="text-white/70">{cohostSuffix}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function SmallAvatar({
  name,
  avatarUrl,
}: {
  name: string
  avatarUrl: string | null
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        className="h-6 w-6 rounded-full bg-black/20 object-cover ring-2 ring-zinc-950"
      />
    )
  }
  const initial = name.slice(0, 1).toUpperCase()
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-br from-violet-400 to-fuchsia-600 text-[10px] font-semibold text-white ring-2 ring-zinc-950">
      {initial}
    </span>
  )
}

async function GuestSummaryBlock({
  eventSlug,
  showCount,
  showNames,
  summary,
  canSeeAllGuests,
}: {
  eventSlug: string
  showCount: boolean
  showNames: boolean
  summary: { going: number; maybe: number; no: number; goingNames: string[] }
  canSeeAllGuests: boolean
}) {
  const t = await getTranslations('rsvp.publicSummary')

  // Both toggles off → hide the block entirely. Host/co-host always get a
  // "View all guests" affordance regardless of public visibility, since
  // they edit the event downstream.
  if (!showCount && !showNames && !canSeeAllGuests) return null

  const VISIBLE_NAMES = 12
  const namesToShow = showNames ? summary.goingNames.slice(0, VISIBLE_NAMES) : []
  const overflow = showNames
    ? Math.max(summary.goingNames.length - VISIBLE_NAMES, 0)
    : 0

  return (
    <div className={cn(FLOATING_SURFACE, 'rounded-2xl p-4 text-sm')}>
      {showCount && (
        <div className="space-y-1 text-white/80">
          <div>{t('countGoing', { count: summary.going })}</div>
          {summary.maybe > 0 && (
            <div className="text-white/60">
              {t('countMaybe', { count: summary.maybe })}
            </div>
          )}
          {summary.no > 0 && (
            <div className="text-white/60">
              {t('countNo', { count: summary.no })}
            </div>
          )}
        </div>
      )}

      {showNames && namesToShow.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {namesToShow.map((n, i) => (
            <li
              key={`${n}-${i}`}
              className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/90"
            >
              {n}
            </li>
          ))}
          {overflow > 0 && (
            <li className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-white/60">
              {t('andMore', { count: overflow })}
            </li>
          )}
        </ul>
      )}

      {canSeeAllGuests && (
        <div className="mt-3">
          <Link
            href={`/${(await getLocaleForLink())}/events/${eventSlug}/edit#guests`}
            className="text-xs text-violet-300 hover:text-violet-200"
          >
            {t('viewAllGuests')}
          </Link>
        </div>
      )}
    </div>
  )
}

async function getLocaleForLink() {
  // Centralizes the locale lookup so the GuestSummaryBlock doesn't need the
  // locale plumbed through as a prop. next-intl's getLocale is server-only.
  const { getLocale } = await import('next-intl/server')
  return getLocale()
}

