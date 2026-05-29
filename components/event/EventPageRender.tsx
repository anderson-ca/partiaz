'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Calendar, Crown, Lock, MapPin, Pencil } from 'lucide-react'
import type { ISourceOptions } from '@tsparticles/engine'
import type { CurrentGuest } from '@/app/actions/rsvp'
import { CoverImage } from '@/components/event/CoverImage'
import { PaymentMethodsCard } from '@/components/event/PaymentMethodsCard'
import type { StoredPaymentMethods } from '@/lib/schemas/payment'
import { EventTitle } from '@/components/event/EventTitle'
import { LazyEffectOverlay as EffectOverlay } from '@/components/event/LazyEffectOverlay'
import { RestrictedAccessCard } from '@/components/event/RestrictedAccessCard'
import { RsvpCta } from '@/components/event/RsvpCta'
import { ThemeBackground } from '@/components/event/ThemeBackground'
import { formatLongDate, type AppLocale } from '@/lib/dates'
import { sanitizeDescription } from '@/lib/sanitize'
import { FLOATING_SURFACE } from '@/lib/ui/floating-surface'
import type { ThemeBackgroundValue } from '@/lib/schemas/theme'
import { cn } from '@/lib/utils'

// Tag-detection heuristic for branching plain-text vs HTML render. Matches
// any `<` followed by an ASCII letter — that's a tag start. Plain text
// containing math like "x < 5" doesn't match because the next char is a
// digit/space, not a letter. Pre-feature descriptions are all plain text.
function descriptionHasHtml(s: string): boolean {
  return /<[a-zA-Z][^>]*>/.test(s)
}

// ─── Event shape consumed by the renderer ──────────────────────────────────
// Already-flattened from the various joins so EventPageRender doesn't have
// to know about FK shapes. Both the public page (real fetch) and the editor
// preview (synthetic from form values) map their data to this shape.

export type EventPageEvent = {
  id: string
  slug: string
  title: string
  status: string
  audience: 'private' | 'public_profile'
  theme: {
    background_type: ThemeBackgroundValue['type']
    background_value: ThemeBackgroundValue
  }
  effect: {
    id: string
    name: string
    engine: 'tsparticles' | 'css'
    config: ISourceOptions
  } | null
  font_preset: {
    font_family: string
    font_weight: number
    letter_spacing: string
    text_transform: string
  }
  text_color: string
  cover_image_url: string | null
  cover_overlay_enabled: boolean
  cover_overlay_text: string | null
  overlay_font: {
    font_family: string
    font_weight: number
    letter_spacing: string
    text_transform: string
  } | null
  cover_overlay_color: string | null
  starts_at: string | null
  ends_at: string | null
  location_text: string | null
  location_address: string | null
  location_hidden_until_rsvp: boolean
  description: string | null
  host: {
    id: string
    display_name: string | null
    avatar_url: string | null
    payment_methods: StoredPaymentMethods
  }
  cohosts: Array<{
    user_id: string
    display_name: string
    avatar_url: string | null
  }>
  show_guest_count: boolean
  show_guest_names: boolean
  allow_maybe: boolean
  require_names: boolean
  allow_rsvp_edit: boolean
  plus_one_enabled: boolean
  plus_one_max_adults: number
  plus_one_max_children: number
  show_payment_info: boolean
}

export type EventPageViewer = {
  isHost: boolean
  isCohost: boolean
  isTokenAuth: boolean
  viewerDisplayName?: string
}

export type EventPageGuestSummary = {
  going: number
  maybe: number
  no: number
  goingNames: string[]
}

export type EventPageCurrentGuest = CurrentGuest | null

type EventPageRenderProps = {
  event: EventPageEvent
  locale: string
  viewer: EventPageViewer
  restricted: boolean
  currentGuest: EventPageCurrentGuest
  guestSummary: EventPageGuestSummary
  /** When true, this is rendered inside the editor preview, not the real
   *  public page. Wired in COMMIT 3 to gate the Edit FAB, draft banner, and
   *  RsvpCta interactivity. Unused this commit. */
  previewMode?: boolean
}

export function EventPageRender({
  event,
  locale,
  viewer,
  restricted,
  currentGuest,
  guestSummary,
  previewMode = false,
}: EventPageRenderProps) {
  const t = useTranslations('events.public')
  const tFields = useTranslations('events.fields')
  const tCohosts = useTranslations('cohosts')
  const tEventLocation = useTranslations('events.location')

  const { isHost, isCohost } = viewer
  const isDraft = event.status === 'draft'
  // In preview mode we always render the RSVP card regardless of the
  // event's actual draft/published state — the host is asking "what will
  // guests see?" and the answer is "the published surface". The Edit FAB
  // and draft banner are separately suppressed below since the user is
  // already inside the editor.
  const isPublished = previewMode || event.status === 'published'

  const hostName = event.host.display_name ?? 'Anonymous'

  // Pre-format the "& X" label here where the cohost data is in scope —
  // next-intl validates ICU vars at the `t()` call site, so deferring to
  // the HostBlock with raw template strings would throw.
  const cohostSuffix =
    event.cohosts.length === 0
      ? null
      : event.cohosts.length === 1
        ? tCohosts('publicAndOne', { name: event.cohosts[0].display_name })
        : tCohosts('publicAndMany', { count: event.cohosts.length })

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
      <ThemeBackground theme={event.theme} className="fixed inset-0" />

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
                config: event.effect.config,
              }
            : null
        }
        className="fixed inset-0"
      />

      {/* Edit FAB — host-only. Sits below the navbar (top-20) so it doesn't
          collide with the navbar's user controls in the top-right corner.
          Mirrors the new Button language (transitions, focus ring, active
          press) without using the Button primitive — the FAB has bespoke
          backdrop styling that doesn't fit the variant palette.
          Hidden in preview mode — the host is already in the editor and
          a "go to editor" link would loop them back to where they are. */}
      {isHost && !previewMode && (
        <Link
          href={`/${locale}/events/${event.slug}/edit`}
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
        {/* Draft banner — host viewing their own draft. Hidden in preview
            mode (host is already in the editor; banner CTA would be a
            self-link). */}
        {isHost && isDraft && !previewMode && (
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
                href={`/${locale}/events/${event.slug}/edit`}
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-violet-500/15 px-2.5 py-1 text-xs font-medium text-violet-300 transition-all duration-150 hover:bg-violet-500/25 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40"
              >
                {t('draftBannerCta')}
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:gap-12">
          {/* LEFT: title + details.
              Inner scrim wraps all body text so it stays readable against
              every theme — light pastels (where white-on-white was breaking
              readability) and busy patterned backgrounds alike. Frosted
              glass aesthetic matches FLOATING_SURFACE/NAV_SURFACE; particle
              effects render via the fixed EffectOverlay below this stacking
              context, so they're not occluded — they soften behind the
              backdrop-blur where the scrim covers them.
              [ui-invitation-text-readability] */}
          <div className="order-2 md:order-1">
            <div className="space-y-6 rounded-2xl bg-black/30 p-6 backdrop-blur-xl sm:p-8">
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

            {/* Description render — branches on tag detection ([ui-6b]).
                Pre-feature plain-text descriptions render unchanged in a
                whitespace-pre-wrap <p>. Rich-text descriptions (TipTap
                HTML output, server-sanitized at write time) render via
                dangerouslySetInnerHTML with defense-in-depth re-sanitization.
                Prose selectors here mirror the editor's preview styling
                (DescriptionInput.tsx) — keep them in sync. */}
            {event.description &&
              (descriptionHasHtml(event.description) ? (
                <div
                  className="text-base text-white/80 [&_a]:text-brand-300 [&_a]:underline [&_a:hover]:text-brand-200 [&_em]:italic [&_li]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p:not(:last-child)]:mb-3 [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeDescription(event.description),
                  }}
                />
              ) : (
                <p className="whitespace-pre-wrap text-base text-white/80">
                  {event.description}
                </p>
              ))}

            <HostBlock
              hostName={hostName}
              hostAvatarUrl={event.host.avatar_url}
              cohosts={event.cohosts}
              hostedByLabel={t('hostedBy')}
              cohostSuffix={cohostSuffix}
            />
            </div>
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

            {/* Payment-methods card — sits ABOVE the RSVP card. Same access
                gate as the RSVP card below (token-bearer / host / cohost
                only — payment info shouldn't leak to anonymous scrapers).
                Renders nothing when the host hasn't entered any methods,
                so the slot is invisible until the host opts in fully via
                profile + per-event toggle. */}
            {event.show_payment_info && !restricted && (
              <PaymentMethodsCard
                paymentMethods={event.host.payment_methods}
              />
            )}

            {/* RSVP card — real flow as of [10]. Draft events skip this
                entirely; the host already sees the draft banner up top. */}
            {isPublished && !restricted && (
              <div className={cn(FLOATING_SURFACE, 'rounded-2xl p-5')}>
                <h2 className="mb-4 text-center text-sm font-medium text-white/80">
                  {t('rsvpPrompt')}
                </h2>
                <RsvpCta
                  eventSlug={event.slug}
                  currentGuest={currentGuest}
                  defaultName={viewer.viewerDisplayName}
                  allowMaybe={event.allow_maybe}
                  requireNames={event.require_names}
                  allowRsvpEdit={event.allow_rsvp_edit}
                  plusOneEnabled={event.plus_one_enabled}
                  plusOneMaxAdults={event.plus_one_max_adults}
                  plusOneMaxChildren={event.plus_one_max_children}
                  previewMode={previewMode}
                />
              </div>
            )}

            {restricted ? (
              <RestrictedAccessCard />
            ) : (
              <GuestSummaryBlock
                eventSlug={event.slug}
                showCount={event.show_guest_count}
                showNames={event.show_guest_names}
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

// ─── Atoms ─────────────────────────────────────────────────────────────────

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

function GuestSummaryBlock({
  eventSlug,
  showCount,
  showNames,
  summary,
  canSeeAllGuests,
}: {
  eventSlug: string
  showCount: boolean
  showNames: boolean
  summary: EventPageGuestSummary
  canSeeAllGuests: boolean
}) {
  const t = useTranslations('rsvp.publicSummary')
  const locale = useLocale()

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
            href={`/${locale}/events/${eventSlug}/edit#guests`}
            className="text-xs text-violet-300 hover:text-violet-200"
          >
            {t('viewAllGuests')}
          </Link>
        </div>
      )}
    </div>
  )
}
