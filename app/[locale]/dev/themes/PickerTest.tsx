'use client'

import { useMemo, useState } from 'react'
import type { ISourceOptions } from '@tsparticles/engine'
import { Button } from '@/components/ui/button'
import { ColorPicker } from '@/components/event/ColorPicker'
import { CoverImage } from '@/components/event/CoverImage'
import {
  CoverImagePicker,
  type CoverSource,
} from '@/components/event/CoverImagePicker'
import { EffectOverlay } from '@/components/event/EffectOverlay'
import { EffectPicker, type EffectRowMin } from '@/components/event/EffectPicker'
import { EventTitle } from '@/components/event/EventTitle'
import { FontPicker, type FontPresetForPicker } from '@/components/event/FontPicker'
import { ThemeBackground } from '@/components/event/ThemeBackground'
import { ThemePicker } from '@/components/event/ThemePicker'
import type { ThemeRow } from '@/lib/schemas/theme'

const DEFAULT_THEME: ThemeRow = {
  id: '__default',
  name: 'Default',
  category: 'dark',
  background_type: 'gradient',
  background_value: {
    type: 'gradient',
    css: 'linear-gradient(135deg, #1f2937 0%, #0f172a 100%)',
  },
  recommended_text_color: '#ffffff',
  order_index: 0,
}

type PickerTestProps = {
  themes: ThemeRow[]
  effects: EffectRowMin[]
  fonts: FontPresetForPicker[]
}

export function PickerTest({ themes, effects, fonts }: PickerTestProps) {
  const [themeId, setThemeId] = useState<string | null>(null)
  const [colorOverride, setColorOverride] = useState<string | null>(null)
  const [effectId, setEffectId] = useState<string | null>(null)
  const [fontPresetId, setFontPresetId] = useState<string | null>(null)
  const [textColor, setTextColor] = useState<string>('#ffffff')
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [coverSource, setCoverSource] = useState<CoverSource | null>(null)

  const selectedTheme: ThemeRow =
    themes.find((t) => t.id === themeId) ?? DEFAULT_THEME

  const selectedEffect: EffectRowMin | null = useMemo(() => {
    if (!effectId) return null
    const e = effects.find((x) => x.id === effectId)
    if (!e) return null
    return e
  }, [effectId, effects])

  const selectedFont: FontPresetForPicker | null =
    fonts.find((f) => f.id === fontPresetId) ?? fonts[0] ?? null

  return (
    <section className="mb-12">
      <h2 className="mb-1 text-lg font-medium">Picker test</h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Live preview of the four picker primitives. Combinations save to local
        state only — nothing persists.
      </p>

      {/* Picker triggers */}
      <div className="flex flex-wrap items-center gap-2">
        <ThemePicker
          themes={themes}
          selectedThemeId={themeId}
          selectedColorOverride={colorOverride}
          onSelectTheme={(id) => {
            setThemeId(id)
            setColorOverride(null)
          }}
          onSelectColor={(hex) => {
            setColorOverride(hex)
            setThemeId(null)
          }}
          trigger={<Button variant="outline">Theme</Button>}
        />
        <EffectPicker
          effects={effects}
          selectedEffectId={effectId}
          onSelectEffect={(id) => setEffectId(id)}
          trigger={<Button variant="outline">Effect</Button>}
        />
        <CoverImagePicker
          currentUrl={coverUrl}
          currentSource={coverSource}
          onChange={(url, source) => {
            setCoverUrl(url)
            setCoverSource(source)
          }}
          trigger={<Button variant="outline">Cover</Button>}
        />
        <ColorPicker
          value={textColor}
          onChange={setTextColor}
          trigger={
            <button
              type="button"
              aria-label="Text color"
              className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm hover:bg-muted"
            >
              <span
                className="h-4 w-4 rounded-full border"
                style={{ backgroundColor: textColor }}
              />
              Text color
            </button>
          }
        />
        {(colorOverride || themeId || effectId) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setThemeId(null)
              setColorOverride(null)
              setEffectId(null)
            }}
          >
            Reset
          </Button>
        )}
      </div>

      {/* Font pills */}
      <div className="mt-3">
        <FontPicker
          fontPresets={fonts}
          selectedFontPresetId={fontPresetId ?? selectedFont?.id ?? null}
          onSelect={setFontPresetId}
        />
      </div>

      {/* Live preview — mimics the eventual event-page layout: theme as the
          page-fill background, effect as the overlay, cover as a hero image
          INSIDE the themed canvas, title below the cover. */}
      <div className="mx-auto mt-4 max-w-md">
        <div
          className="relative overflow-hidden rounded-2xl border shadow-sm"
          style={{ aspectRatio: '9 / 14' }}
        >
          <ThemeBackground
            theme={selectedTheme}
            colorOverride={colorOverride ?? undefined}
          />
          <EffectOverlay
            effect={
              selectedEffect
                ? {
                    id: selectedEffect.id,
                    name: selectedEffect.name,
                    engine:
                      selectedEffect.engine === 'tsparticles'
                        ? 'tsparticles'
                        : 'css',
                    config: selectedEffect.config as ISourceOptions,
                  }
                : null
            }
            className="z-10"
          />
          <div className="relative z-20 flex h-full flex-col gap-4 p-5">
            {coverUrl && <CoverImage url={coverUrl} alt="" />}
            <div className="flex-1 px-1 text-center">
              {selectedFont && (
                <EventTitle
                  text="Saturday Night"
                  fontPreset={selectedFont}
                  textColor={textColor}
                  className="text-2xl sm:text-3xl"
                />
              )}
              {/* Faux RSVP cluster so the page anatomy is obvious at a glance */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <span
                  className="rounded-full border px-3 py-1.5 text-xs"
                  style={{
                    borderColor: textColor,
                    color: textColor,
                  }}
                >
                  Going
                </span>
                <span
                  className="rounded-full border px-3 py-1.5 text-xs"
                  style={{
                    borderColor: textColor,
                    color: textColor,
                    opacity: 0.7,
                  }}
                >
                  Maybe
                </span>
                <span
                  className="rounded-full border px-3 py-1.5 text-xs"
                  style={{
                    borderColor: textColor,
                    color: textColor,
                    opacity: 0.7,
                  }}
                >
                  Can&apos;t go
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selection summary */}
      <dl className="mt-3 grid grid-cols-1 gap-1 text-xs text-muted-foreground sm:grid-cols-2">
        <div>
          <dt className="inline font-medium text-foreground">Theme:</dt>{' '}
          <dd className="inline">
            {themeId ? selectedTheme.name : colorOverride ? `solid ${colorOverride}` : '— default —'}
          </dd>
        </div>
        <div>
          <dt className="inline font-medium text-foreground">Effect:</dt>{' '}
          <dd className="inline">{selectedEffect?.name ?? '— none —'}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-foreground">Font:</dt>{' '}
          <dd className="inline">{selectedFont?.font_family ?? '—'}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-foreground">Color:</dt>{' '}
          <dd className="inline">{textColor}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-foreground">Cover:</dt>{' '}
          <dd className="inline">
            {coverUrl ? `${coverSource} · ${coverUrl.slice(0, 60)}…` : '— none —'}
          </dd>
        </div>
      </dl>
    </section>
  )
}
