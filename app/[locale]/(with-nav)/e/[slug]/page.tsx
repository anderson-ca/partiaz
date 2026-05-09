import Link from 'next/link'
import { notFound } from 'next/navigation'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Calendar, Crown, Lock, Pencil } from 'lucide-react'
import type { ISourceOptions } from '@tsparticles/engine'
import { CoverImage } from '@/components/event/CoverImage'
import { EventTitle } from '@/components/event/EventTitle'
import { LazyEffectOverlay as EffectOverlay } from '@/components/event/LazyEffectOverlay'
import { RestrictedAccessCard } from '@/components/event/RestrictedAccessCard'
import { RsvpButtonsStub } from '@/components/event/RsvpButtonsStub'
import { ThemeBackground } from '@/components/event/ThemeBackground'
import { FLOATING_SURFACE } from '@/lib/ui/floating-surface'
import type { ThemeBackgroundValue } from '@/lib/schemas/theme'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

type EventAudience = 'private' | 'public_profile'

export default async function PublicEventPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations('events.public')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Single-query fetch with joins on catalog tables + host profile. RLS
  // handles visibility: drafts are visible only to the host; published are
  // visible to anon + authenticated. Catalog tables are public-read so the
  // joins resolve for anon viewers too.
  const { data: event, error } = await supabase
    .from('events')
    .select(
      `id, slug, title, status, audience, text_color, cover_image_url,
       theme:themes(id,name,category,background_type,background_value,recommended_text_color,order_index),
       effect:effects(id,name,category,engine,config),
       font_preset:font_presets(id,name,category,font_family,font_weight,letter_spacing,text_transform),
       host:profiles!events_host_id_fkey(id,display_name,avatar_url)`,
    )
    .eq('slug', slug)
    .maybeSingle()

  if (error || !event || !event.theme || !event.font_preset || !event.host) {
    notFound()
  }

  const isHost = !!user && user.id === event.host.id
  const isDraft = event.status === 'draft'
  const audience = (event.audience ?? 'private') as EventAudience
  // Restricted access: private event + viewer is not the host. Real RSVP'd
  // users get the unrestricted view in Prompt 10; for now, every non-host
  // visitor on a private event sees the locked card.
  const restricted = audience === 'private' && !isHost

  const theme = {
    background_type: event.theme.background_type as ThemeBackgroundValue['type'],
    background_value: event.theme.background_value as ThemeBackgroundValue,
  }

  const hostName = event.host.display_name ?? 'Anonymous'

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

            <DetailRow icon={<Calendar className="h-4 w-4" />}>
              {t('dateTbd')}
            </DetailRow>
            {/* Location row hidden under restricted access card on private
                events — show on the bare layout for hosts and public events. */}
            {!restricted && (
              <DetailRow icon={<Lock className="h-4 w-4" />}>
                {t('locationLocked')}
              </DetailRow>
            )}

            <div className="flex items-center gap-3">
              <HostAvatar name={hostName} avatarUrl={event.host.avatar_url} />
              <div className="leading-tight">
                <div className="text-xs uppercase tracking-wide text-white/60">
                  {t('hostedBy')}
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                  <Crown className="h-3.5 w-3.5 text-yellow-300" />
                  {hostName}
                </div>
              </div>
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

            {/* RSVP / Restricted overlay */}
            <div className={cn(FLOATING_SURFACE, 'rounded-2xl p-5')}>
              <h2 className="mb-4 text-center text-sm font-medium text-white/80">
                {t('rsvpPrompt')}
              </h2>
              <RsvpButtonsStub />
            </div>

            {restricted ? (
              <RestrictedAccessCard />
            ) : (
              <GuestListPlaceholder />
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
    <div
      data-todo="08.1"
      className="flex items-center gap-2 text-base text-white/80"
    >
      <span className="text-white/60">{icon}</span>
      <span>{children}</span>
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

async function GuestListPlaceholder() {
  const t = await getTranslations('events.public')
  return (
    <div
      data-todo="10"
      className={cn(FLOATING_SURFACE, 'rounded-2xl p-4')}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-white">
          {t('guestListTitle')}
        </span>
        <button
          type="button"
          className="text-xs text-white/70 hover:text-white"
          disabled
        >
          {t('viewAll')}
        </button>
      </div>
      <div className="flex -space-x-2">
        {[
          'from-pink-400 to-rose-600',
          'from-cyan-400 to-blue-600',
          'from-amber-400 to-orange-600',
        ].map((g, i) => (
          <span
            key={i}
            className={cn(
              'inline-flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br text-xs font-semibold text-white ring-2 ring-zinc-900',
              g,
            )}
          >
            ?
          </span>
        ))}
      </div>
    </div>
  )
}
