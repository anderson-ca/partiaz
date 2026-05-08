import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { ThemeBackground } from '@/components/event/ThemeBackground'
import {
  EventTitle,
  type FontPresetForRender,
} from '@/components/event/EventTitle'
import { createClient } from '@/lib/supabase/server'
import type { ThemeRow } from '@/lib/schemas/theme'
import { EffectsSection } from './EffectsSection'
import { PickerTest } from './PickerTest'

const FONT_SAMPLE = 'Salam, dünya! Привет, мир! Hello, world!'

const PREVIEW_FONT: FontPresetForRender = {
  font_family: 'Inter',
  font_weight: 600,
  letter_spacing: '-0.01em',
  text_transform: 'none',
}

export default async function ThemesDevPage({
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
    redirect(`/${locale}/login`)
  }

  const [themesRes, effectsRes, fontsRes] = await Promise.all([
    supabase
      .from('themes')
      .select('id,name,category,background_type,background_value,recommended_text_color,order_index')
      .order('background_type')
      .order('order_index'),
    supabase
      .from('effects')
      .select('id,name,category,engine,config,order_index')
      .order('order_index'),
    supabase
      .from('font_presets')
      .select('id,name,category,font_family,font_weight,letter_spacing,text_transform')
      .order('category')
      .order('name'),
  ])

  const themes = (themesRes.data ?? []) as unknown as ThemeRow[]
  const effects = effectsRes.data ?? []
  const fonts = fontsRes.data ?? []

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Theme catalog test
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Internal QA harness. Themes: {themes.length} · Effects: {effects.length} · Fonts: {fonts.length}.
        </p>
      </header>

      <PickerTest themes={themes} effects={effects} fonts={fonts} />

      {/* Themes */}
      <section className="mb-12">
        <h2 className="mb-3 text-lg font-medium">Themes</h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {themes.map((t) => (
            <li
              key={t.id}
              className="relative overflow-hidden rounded-xl border"
              style={{ aspectRatio: '3 / 2' }}
            >
              <ThemeBackground theme={t} />
              <div className="absolute inset-0 z-10 flex flex-col justify-end p-4">
                <EventTitle
                  as="span"
                  text={t.name}
                  fontPreset={PREVIEW_FONT}
                  textColor={t.recommended_text_color}
                  className="text-xl"
                />
                <span
                  className="mt-1 text-xs opacity-80"
                  style={{ color: t.recommended_text_color }}
                >
                  {t.category} · {t.background_type}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Effects */}
      <section className="mb-12">
        <h2 className="mb-1 text-lg font-medium">Effects</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Tap a card to activate. Only one runs at a time.
        </p>
        <EffectsSection effects={effects} />
      </section>

      {/* Fonts */}
      <section className="mb-12">
        <h2 className="mb-3 text-lg font-medium">Fonts</h2>
        <ul className="space-y-4">
          {fonts.map((f) => (
            <li
              key={f.id}
              className="rounded-lg border bg-card p-4"
            >
              <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                {f.category} · {f.font_family} · {f.font_weight}
              </div>
              <EventTitle
                as="p"
                text={FONT_SAMPLE}
                fontPreset={f}
                textColor="var(--foreground)"
                className="text-2xl leading-snug"
              />
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
