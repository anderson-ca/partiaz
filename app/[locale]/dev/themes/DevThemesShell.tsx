'use client'

import { useMemo, useState } from 'react'
import {
  Calendar,
  Crown,
  DollarSign,
  Image as ImageIcon,
  MapPin,
  Plus,
  Users,
} from 'lucide-react'
import type { ISourceOptions } from '@tsparticles/engine'
import { CoverImage } from '@/components/event/CoverImage'
import {
  CoverImagePicker,
  type CoverSource,
} from '@/components/event/CoverImagePicker'
import { ColorPicker } from '@/components/event/ColorPicker'
import { EditorRail } from '@/components/event/EditorRail'
import { EffectOverlay } from '@/components/event/EffectOverlay'
import type { EffectRowMin } from '@/components/event/EffectPicker'
import { EventTitle } from '@/components/event/EventTitle'
import { FontPicker, type FontPresetForPicker } from '@/components/event/FontPicker'
import { ThemeBackground } from '@/components/event/ThemeBackground'
import { cn } from '@/lib/utils'
import type { ThemeRow } from '@/lib/schemas/theme'
import { EffectsSection } from './EffectsSection'

type DevThemesShellProps = {
  themes: ThemeRow[]
  effects: EffectRowMin[]
  fonts: FontPresetForPicker[]
}

export function DevThemesShell({ themes, effects, fonts }: DevThemesShellProps) {
  // Default to a dark theme so the shell looks like the Partiful editor on
  // first paint. Falls back to the first theme if no dark one exists.
  const defaultTheme: ThemeRow = useMemo(
    () =>
      themes.find((t) => t.category === 'dark' && t.background_type === 'gradient') ??
      themes[0],
    [themes],
  )

  const [themeId, setThemeId] = useState<string>(defaultTheme.id)
  const [colorOverride, setColorOverride] = useState<string | null>(null)
  const [effectId, setEffectId] = useState<string | null>(null)
  const [fontPresetId, setFontPresetId] = useState<string>(
    fonts.find((f) => f.font_family === 'Inter')?.id ?? fonts[0]?.id ?? '',
  )
  const [textColor, setTextColor] = useState<string>('#ffffff')
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [coverSource, setCoverSource] = useState<CoverSource | null>(null)

  const selectedTheme: ThemeRow =
    themes.find((t) => t.id === themeId) ?? defaultTheme
  const selectedEffect: EffectRowMin | null = effectId
    ? effects.find((e) => e.id === effectId) ?? null
    : null
  const selectedFont: FontPresetForPicker | null =
    fonts.find((f) => f.id === fontPresetId) ?? fonts[0] ?? null

  return (
    <>
      {/* Layer 0: themed full-bleed background, scrolls fixed */}
      <ThemeBackground
        theme={selectedTheme}
        colorOverride={colorOverride ?? undefined}
        className="fixed inset-0"
      />

      {/* Layer 1: ambient effect overlay */}
      <EffectOverlay
        effect={
          selectedEffect
            ? {
                id: selectedEffect.id,
                name: selectedEffect.name,
                engine:
                  selectedEffect.engine === 'tsparticles' ? 'tsparticles' : 'css',
                config: selectedEffect.config as ISourceOptions,
              }
            : null
        }
        className="fixed inset-0"
      />

      {/* Layer 2: scrollable page content. md:pr-28 reserves a gutter on the
          right edge for the EditorRail (which is `fixed right-4` and ~80px
          wide) so content never lands behind it. */}
      <div className="relative z-20 min-h-screen pb-32 md:pb-12">
        {/* Header */}
        <header className="mx-auto max-w-5xl px-4 pt-8 pb-4 text-white md:px-8 md:pr-28">
          <h1 className="text-2xl font-semibold tracking-tight drop-shadow">
            parti.az dev
          </h1>
          <p className="mt-1 text-xs text-white/70">
            Themes: {themes.length} · Effects: {effects.length} · Fonts: {fonts.length}.
            Editor mockup uses the theme/effect/font catalog live; below the mock
            are catalog QA grids unchanged from prior prompts.
          </p>
        </header>

        {/* Editor mockup — two equal columns on md+. minmax(0, 1fr) prevents
            grid columns from auto-growing to accommodate intrinsic content
            width (which would push the right column under the rail). */}
        <section className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-8 md:px-8 md:pr-28">
          <EventCardMock
            title="Saturday Night"
            font={selectedFont}
            fonts={fonts}
            fontPresetId={fontPresetId}
            onSelectFont={setFontPresetId}
            textColor={textColor}
            onChangeTextColor={setTextColor}
          />
          <CoverAreaMock
            currentUrl={coverUrl}
            currentSource={coverSource}
            onChangeCover={(url, source) => {
              setCoverUrl(url)
              setCoverSource(source)
            }}
          />
        </section>

        {/* Catalog QA — kept verbatim from earlier prompts */}
        <section className="mx-auto mt-12 max-w-5xl space-y-12 px-4 md:px-8 md:pr-28">
          <div>
            <h2 className="mb-3 text-lg font-medium text-white">Themes (catalog)</h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {themes.map((t) => (
                <li
                  key={t.id}
                  className="relative overflow-hidden rounded-xl border border-white/10"
                  style={{ aspectRatio: '3 / 2' }}
                >
                  <ThemeBackground theme={t} />
                  <div className="absolute inset-0 z-10 flex flex-col justify-end p-3">
                    <span
                      className="text-base font-medium"
                      style={{ color: t.recommended_text_color }}
                    >
                      {t.name}
                    </span>
                    <span
                      className="text-[10px] opacity-80"
                      style={{ color: t.recommended_text_color }}
                    >
                      {t.category} · {t.background_type}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-1 text-lg font-medium text-white">Effects (catalog)</h2>
            <p className="mb-3 text-xs text-white/60">
              Tap a card to activate. Only one runs at a time.
            </p>
            <EffectsSection effects={effects} />
          </div>

          <div>
            <h2 className="mb-3 text-lg font-medium text-white">Fonts (catalog)</h2>
            <ul className="space-y-3">
              {fonts.map((f) => (
                <li
                  key={f.id}
                  className="rounded-lg border border-white/10 bg-black/30 p-4 backdrop-blur-sm"
                >
                  <div className="mb-1 text-xs uppercase tracking-wide text-white/60">
                    {f.category} · {f.font_family} · {f.font_weight}
                  </div>
                  <EventTitle
                    as="p"
                    text="Salam, dünya! Привет, мир! Hello, world!"
                    fontPreset={f}
                    textColor="#ffffff"
                    className="text-2xl leading-snug"
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* Floating editor rail */}
      <EditorRail
        themes={themes}
        effects={effects}
        selectedTheme={selectedTheme}
        selectedEffect={selectedEffect}
        selectedColorOverride={colorOverride}
        onSelectTheme={(id) => {
          setThemeId(id)
          setColorOverride(null)
        }}
        onSelectColorOverride={(hex) => setColorOverride(hex)}
        onSelectEffect={(id) => setEffectId(id)}
      />
    </>
  )
}

// ----- Event card mock (left column) ---------------------------------------

function EventCardMock({
  title,
  font,
  fonts,
  fontPresetId,
  onSelectFont,
  textColor,
  onChangeTextColor,
}: {
  title: string
  font: FontPresetForPicker | null
  fonts: FontPresetForPicker[]
  fontPresetId: string
  onSelectFont: (id: string) => void
  textColor: string
  onChangeTextColor: (hex: string) => void
}) {
  return (
    <div className="space-y-3 rounded-2xl bg-black/35 p-5 backdrop-blur-md ring-1 ring-white/10 md:p-6">
      {/* Title sits directly in the card (no extra inner block) so it can
          breathe at large sizes. min-w-0 on this stack lets the FontPicker's
          ScrollArea clip overflow inside the grid column. */}
      <div className="min-w-0 space-y-3">
        {font && (
          <EventTitle
            as="h2"
            text={title}
            fontPreset={font}
            textColor={textColor}
            className="text-4xl leading-tight sm:text-5xl"
          />
        )}
        <FontPicker
          fontPresets={fonts}
          selectedFontPresetId={fontPresetId}
          onSelect={onSelectFont}
        />
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-white/70">Title color</span>
          <ColorPicker
            value={textColor}
            onChange={onChangeTextColor}
            trigger={
              <button
                type="button"
                aria-label="Title color"
                className="h-5 w-5 rounded-full border border-white/40"
                style={{ backgroundColor: textColor }}
              />
            }
          />
        </div>
      </div>

      {/* Placeholder rows — non-functional, just shape. Each row matches the
          Partiful editor's "input chip" pattern. */}
      <PlaceholderRow icon={<Calendar className="h-4 w-4" />}>
        Set a date…
      </PlaceholderRow>
      <PlaceholderRow icon={<Crown className="h-4 w-4" />}>
        Hosted by …
      </PlaceholderRow>
      <PlaceholderRow icon={<MapPin className="h-4 w-4" />}>Location</PlaceholderRow>
      <PlaceholderRow icon={<Users className="h-4 w-4" />}>
        Unlimited spots
      </PlaceholderRow>
      <PlaceholderRow icon={<DollarSign className="h-4 w-4" />}>
        Cost per person
      </PlaceholderRow>

      {/* Section pills */}
      <div className="flex flex-wrap gap-2 pt-1">
        {['Link', 'Playlist', 'Registry', 'Dress code'].map((label) => (
          <span
            key={label}
            className="inline-flex items-center gap-1 rounded-full bg-black/40 px-3 py-1.5 text-xs text-white/80"
          >
            <Plus className="h-3.5 w-3.5" />
            {label}
          </span>
        ))}
      </div>

      {/* Description box */}
      <div className="rounded-xl bg-black/30 p-4 text-sm text-white/40">
        Add a description of your event
      </div>
    </div>
  )
}

function PlaceholderRow({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-black/30 px-4 py-3 text-sm text-white/70">
      <span className="text-white/60">{icon}</span>
      <span>{children}</span>
    </div>
  )
}

// ----- Cover area mock (right column) --------------------------------------

function CoverAreaMock({
  currentUrl,
  currentSource,
  onChangeCover,
}: {
  currentUrl: string | null
  currentSource: CoverSource | null
  onChangeCover: (url: string | null, source: CoverSource | null) => void
}) {
  return (
    <div className="space-y-4">
      {/* Cover slot: square aspect to match Partiful. Empty → dashed drop
          zone; set → the cover image fills the square. The whole slot is the
          picker trigger. */}
      <CoverImagePicker
        currentUrl={currentUrl}
        currentSource={currentSource}
        onChange={onChangeCover}
        trigger={
          currentUrl ? (
            <button
              type="button"
              aria-label="Change cover"
              className="block w-full overflow-hidden rounded-2xl ring-1 ring-white/10 transition hover:ring-white/30"
            >
              <CoverImage url={currentUrl} alt="" aspect="1 / 1" />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Add cover image"
              className={cn(
                'flex w-full items-center justify-center rounded-2xl border-2 border-dashed border-white/30',
                'bg-black/20 text-white/70 backdrop-blur-sm transition hover:border-white/60 hover:text-white',
              )}
              style={{ aspectRatio: '1 / 1' }}
            >
              <span className="flex flex-col items-center gap-2">
                <ImageIcon className="h-7 w-7" />
                <span className="text-sm">Add cover image</span>
              </span>
            </button>
          )
        }
      />

      {/* RSVP options preview — illustrative, no interactivity */}
      <div className="rounded-2xl bg-black/35 p-4 backdrop-blur-md ring-1 ring-white/10">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-white">RSVP Options</span>
          <span className="rounded-full bg-black/40 px-3 py-1 text-xs text-white/80">
            👍 Emojis
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { emoji: '👍', label: 'Going' },
            { emoji: '🤔', label: 'Maybe' },
            { emoji: '😢', label: "Can't Go" },
          ].map((b) => (
            <div
              key={b.label}
              className="flex flex-col items-center gap-1.5 rounded-xl bg-white/5 px-2 py-3 text-white/80"
            >
              <span className="text-2xl" aria-hidden>
                {b.emoji}
              </span>
              <span className="text-xs">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
