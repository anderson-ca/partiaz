'use client'

import { useTranslations } from 'next-intl'
import { Switch } from '@/components/ui/switch'
import { ColorPicker } from '@/components/event/ColorPicker'
import {
  FontPicker,
  type FontPresetForPicker,
} from '@/components/event/FontPicker'

type CoverOverlayEditorProps = {
  enabled: boolean
  text: string
  fontPresetId: string | null
  color: string
  fontPresets: FontPresetForPicker[]
  /** Used as the placeholder + the implicit default at save time. */
  eventTitle: string
  onChange: (next: {
    enabled: boolean
    text: string
    fontPresetId: string | null
    color: string
  }) => void
}

/**
 * Cover overlay editor — the shadcn Switch reveals three controls (text,
 * font, color) that ride on top of the cover image. Hidden, not just
 * disabled, when the toggle is off — keeps the form section quiet for the
 * common case where users don't want overlay text.
 *
 * The visible controls keep their state in the parent EventEditorForm so
 * that toggling off → on → off doesn't lose what the user typed.
 */
export function CoverOverlayEditor({
  enabled,
  text,
  fontPresetId,
  color,
  fontPresets,
  eventTitle,
  onChange,
}: CoverOverlayEditorProps) {
  const t = useTranslations('cover.overlay')

  return (
    <div className="space-y-3 rounded-2xl bg-black/30 p-4 ring-1 ring-white/10 backdrop-blur-md">
      <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-white">
        <span className="font-medium">{t('toggle')}</span>
        <Switch
          checked={enabled}
          onCheckedChange={(next) =>
            onChange({ enabled: next, text, fontPresetId, color })
          }
        />
      </label>

      {enabled && (
        <div className="space-y-3 pt-1">
          <div>
            <label
              htmlFor="cover-overlay-text"
              className="mb-1.5 block text-xs font-medium text-white/70"
            >
              {t('textLabel')}
            </label>
            <input
              id="cover-overlay-text"
              type="text"
              maxLength={200}
              value={text}
              onChange={(e) =>
                onChange({
                  enabled,
                  text: e.target.value,
                  fontPresetId,
                  color,
                })
              }
              placeholder={eventTitle || t('textPlaceholder')}
              className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
            />
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-medium text-white/70">
              {t('fontLabel')}
            </span>
            <FontPicker
              fontPresets={fontPresets}
              selectedFontPresetId={fontPresetId}
              onSelect={(id) =>
                onChange({ enabled, text, fontPresetId: id, color })
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-white/70">
              {t('colorLabel')}
            </span>
            <ColorPicker
              value={color}
              onChange={(hex) =>
                onChange({ enabled, text, fontPresetId, color: hex })
              }
              trigger={
                <button
                  type="button"
                  aria-label={t('colorLabel')}
                  className="h-5 w-5 rounded-full border border-white/40"
                  style={{ backgroundColor: color }}
                />
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}
