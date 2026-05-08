import Link from 'next/link'
import { notFound } from 'next/navigation'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import type { ISourceOptions } from '@tsparticles/engine'
import { Button } from '@/components/ui/button'
import { CoverImage } from '@/components/event/CoverImage'
import { EffectOverlay } from '@/components/event/EffectOverlay'
import { EventTitle } from '@/components/event/EventTitle'
import { ThemeBackground } from '@/components/event/ThemeBackground'
import type { ThemeBackgroundValue } from '@/lib/schemas/theme'
import { createClient } from '@/lib/supabase/server'

// Stub public event page. Real layout (RSVP form, guest list, etc.) lands in
// Prompt 09. The job here is to prove the create→render loop works.

export default async function PublicEventPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations('events')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // RLS handles visibility: drafts are visible only to the host;
  // published events are visible to anyone (anon + authenticated).
  // Joining the catalog tables in one query — public-readable per their RLS.
  const { data: event, error } = await supabase
    .from('events')
    .select(
      `slug,title,host_id,text_color,
       theme:themes(id,name,category,background_type,background_value,recommended_text_color,order_index),
       effect:effects(id,name,category,engine,config),
       font_preset:font_presets(id,name,category,font_family,font_weight,letter_spacing,text_transform),
       cover_image_url`,
    )
    .eq('slug', slug)
    .maybeSingle()

  if (error || !event || !event.theme || !event.font_preset) {
    notFound()
  }

  const isOwner = !!user && user.id === event.host_id
  const theme = {
    background_type: event.theme.background_type as ThemeBackgroundValue['type'],
    background_value: event.theme.background_value as ThemeBackgroundValue,
  }

  return (
    <>
      <ThemeBackground theme={theme} className="fixed inset-0" />
      <EffectOverlay
        effect={
          event.effect
            ? {
                id: event.effect.id,
                name: event.effect.name,
                engine:
                  event.effect.engine === 'tsparticles' ? 'tsparticles' : 'css',
                config: event.effect.config as ISourceOptions,
              }
            : null
        }
        className="fixed inset-0"
      />

      <main className="relative z-20 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 px-4 py-12 text-center">
        {event.cover_image_url && (
          <div className="w-full">
            <CoverImage url={event.cover_image_url} alt="" aspect="1 / 1" priority />
          </div>
        )}

        <EventTitle
          text={event.title}
          fontPreset={{
            font_family: event.font_preset.font_family,
            font_weight: event.font_preset.font_weight,
            letter_spacing: event.font_preset.letter_spacing,
            text_transform: event.font_preset.text_transform,
          }}
          textColor={event.text_color}
          className="text-4xl leading-tight sm:text-5xl"
        />

        {isOwner && (
          <Button asChild variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
            <Link href={`/${locale}/events/${slug}/edit`}>
              {t('editor.editButton')}
            </Link>
          </Button>
        )}
      </main>
    </>
  )
}
