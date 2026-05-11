'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import type { ISourceOptions } from '@tsparticles/engine'
import {
  Calendar,
  Crown,
  DollarSign,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  Users,
} from 'lucide-react'
import { createEvent, updateEvent } from '@/app/actions/events'
import { Button } from '@/components/ui/button'
import { ColorPicker } from '@/components/event/ColorPicker'
import { CoverImage } from '@/components/event/CoverImage'
import {
  CoverImagePicker,
  type CoverSource,
} from '@/components/event/CoverImagePicker'
import { CoverOverlayEditor } from '@/components/event/CoverOverlayEditor'
import type { CoverIllustration } from '@/components/event/cover-picker/LibraryTab'
import { DeleteEventDialog } from '@/components/event/DeleteEventDialog'
import { EditorRail } from '@/components/event/EditorRail'
import { LazyEffectOverlay as EffectOverlay } from '@/components/event/LazyEffectOverlay'
import { PublishToggle } from '@/components/event/PublishToggle'
import type { EffectRowMin } from '@/components/event/EffectPicker'
import { EventTitle } from '@/components/event/EventTitle'
import {
  FontPicker,
  type FontPresetForPicker,
} from '@/components/event/FontPicker'
import { ThemeBackground } from '@/components/event/ThemeBackground'
import { fontFamilyToCssVar } from '@/lib/fonts'
import { eventInputSchema, type EventInput } from '@/lib/schemas/event'
import type { ThemeRow } from '@/lib/schemas/theme'
import { cn } from '@/lib/utils'

export type EventEditorInitial = {
  id: string
  slug: string
  status: 'draft' | 'published' | 'canceled'
  title: string
  theme_id: string
  effect_id: string | null
  font_preset_id: string
  text_color: string
  cover_image_url: string | null
  cover_image_source: string | null
  cover_overlay_enabled: boolean
  cover_overlay_text: string | null
  cover_overlay_font_id: string | null
  cover_overlay_color: string | null
}

type EventEditorFormProps = {
  themes: ThemeRow[]
  effects: EffectRowMin[]
  fontPresets: FontPresetForPicker[]
  illustrations: CoverIllustration[]
  /** When editing an existing event. Omit for create mode. */
  initialEvent?: EventEditorInitial
  mode: 'create' | 'edit'
  /** Locale for redirect after create. */
  locale: string
}

function pickDefaultTheme(themes: ThemeRow[]): ThemeRow {
  return (
    themes.find(
      (t) => t.category === 'dark' && t.background_type === 'gradient',
    ) ??
    themes[0]
  )
}

function pickDefaultFont(
  fonts: FontPresetForPicker[],
): FontPresetForPicker | undefined {
  return fonts.find((f) => f.font_family === 'Inter') ?? fonts[0]
}

function normalizeCoverSource(raw: string | null): CoverSource | null {
  return raw === 'illustration' || raw === 'gif' || raw === 'upload'
    ? raw
    : null
}

export function EventEditorForm({
  themes,
  effects,
  fontPresets,
  illustrations,
  initialEvent,
  mode,
  locale,
}: EventEditorFormProps) {
  const t = useTranslations('events.editor')
  const tCommon = useTranslations('common')
  const router = useRouter()

  const defaultTheme = useMemo(() => pickDefaultTheme(themes), [themes])
  const defaultFont = useMemo(() => pickDefaultFont(fontPresets), [fontPresets])

  const form = useForm<EventInput>({
    resolver: zodResolver(eventInputSchema),
    defaultValues: initialEvent
      ? {
          title: initialEvent.title === 'Untitled Event' ? '' : initialEvent.title,
          theme_id: initialEvent.theme_id,
          effect_id: initialEvent.effect_id,
          font_preset_id: initialEvent.font_preset_id,
          text_color: initialEvent.text_color,
          cover_image_url: initialEvent.cover_image_url,
          cover_image_source: normalizeCoverSource(
            initialEvent.cover_image_source,
          ),
          cover_overlay_enabled: initialEvent.cover_overlay_enabled,
          cover_overlay_text: initialEvent.cover_overlay_text,
          cover_overlay_font_id: initialEvent.cover_overlay_font_id,
          cover_overlay_color: initialEvent.cover_overlay_color,
        }
      : {
          title: '',
          theme_id: defaultTheme.id,
          effect_id: null,
          font_preset_id: defaultFont?.id ?? '',
          text_color: '#ffffff',
          cover_image_url: null,
          cover_image_source: null,
          cover_overlay_enabled: false,
          cover_overlay_text: null,
          cover_overlay_font_id: null,
          cover_overlay_color: null,
        },
  })

  // Watch every field that drives the live preview. RHF subscribes per-field,
  // so this only re-renders the parts that change.
  const themeId = form.watch('theme_id')
  const effectId = form.watch('effect_id')
  const fontPresetId = form.watch('font_preset_id')
  const textColor = form.watch('text_color')
  const title = form.watch('title')
  const coverUrl = form.watch('cover_image_url')
  const coverSource = form.watch('cover_image_source')
  const overlayEnabled = form.watch('cover_overlay_enabled') ?? false
  const overlayText = form.watch('cover_overlay_text') ?? ''
  const overlayFontId = form.watch('cover_overlay_font_id') ?? null
  const overlayColor = form.watch('cover_overlay_color') ?? '#ffffff'

  const overlayFont: FontPresetForPicker | null = overlayFontId
    ? fontPresets.find((f) => f.id === overlayFontId) ?? null
    : null

  const selectedTheme: ThemeRow =
    themes.find((th) => th.id === themeId) ?? defaultTheme
  const selectedEffect: EffectRowMin | null = effectId
    ? effects.find((e) => e.id === effectId) ?? null
    : null
  const selectedFont: FontPresetForPicker | null =
    fontPresets.find((f) => f.id === fontPresetId) ?? defaultFont ?? null

  // Memoize the effect-prop object so its identity is stable across keystrokes
  // on unrelated form fields (title, color, etc.). tsParticles' <Particles>
  // re-initialises the engine — restarting any in-flight animation — when its
  // `options` prop receives a new reference, so a fresh object literal per
  // render would yank the effect back to frame 0 on every keystroke.
  const effectForOverlay = useMemo(
    () =>
      selectedEffect
        ? {
            id: selectedEffect.id,
            name: selectedEffect.name,
            engine:
              selectedEffect.engine === 'tsparticles' ? ('tsparticles' as const) : ('css' as const),
            config: selectedEffect.config as ISourceOptions,
          }
        : null,
    [selectedEffect],
  )

  const [pending, setPending] = useState(false)

  async function onSubmit(values: EventInput) {
    setPending(true)
    try {
      if (mode === 'create') {
        const result = await createEvent(values)
        if (result.ok) {
          // Hard navigation so the new stub page renders fresh under the
          // user's session.
          router.push(`/${locale}/e/${result.slug}`)
        } else {
          toast.error(t('saveError'))
          setPending(false)
        }
      } else {
        if (!initialEvent) {
          toast.error(t('saveError'))
          setPending(false)
          return
        }
        const result = await updateEvent(initialEvent.slug, values)
        if (result.ok) {
          toast.success(t('saveSuccess'))
        } else {
          toast.error(t('saveError'))
        }
        setPending(false)
      }
    } catch {
      toast.error(t('saveError'))
      setPending(false)
    }
  }

  const titleFontFamily = selectedFont
    ? `var(${fontFamilyToCssVar[selectedFont.font_family] ?? '--font-inter'})`
    : 'inherit'

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="contents"
      noValidate
    >
      {/* Layer 0: themed full-bleed background, scrolls fixed */}
      <ThemeBackground theme={selectedTheme} className="fixed inset-0" />

      {/* Layer 1: ambient effect overlay */}
      <EffectOverlay effect={effectForOverlay} className="fixed inset-0" />

      {/* Layer 2: page content */}
      <div className="relative z-20 min-h-screen pb-32 md:pb-12">
        {/* Top bar — Save draft + Make it public */}
        <header className="mx-auto flex max-w-5xl items-center justify-end gap-3 px-4 pt-6 md:px-8 md:pr-28">
          <PublishToggle
            mode={mode}
            slug={initialEvent?.slug}
            currentStatus={initialEvent?.status}
          />
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {pending ? tCommon('saving') : t('saveDraft')}
          </Button>
        </header>

        {/* Editor — two-column on md+ */}
        <section className="mx-auto mt-4 grid max-w-5xl grid-cols-1 gap-6 px-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-8 md:px-8 md:pr-28">
          <EventCardForm
            form={form}
            title={title ?? ''}
            titleFontFamily={titleFontFamily}
            fontWeight={selectedFont?.font_weight ?? 500}
            textColor={textColor}
            selectedFont={selectedFont}
            fontPresets={fontPresets}
            fontPresetId={fontPresetId}
          />
          <CoverArea
            illustrations={illustrations}
            currentUrl={coverUrl}
            currentSource={normalizeCoverSource(coverSource)}
            onChange={(url, source) => {
              form.setValue('cover_image_url', url, { shouldDirty: true })
              form.setValue('cover_image_source', source, { shouldDirty: true })
            }}
            overlayEnabled={overlayEnabled}
            overlayText={overlayText}
            overlayFontId={overlayFontId}
            overlayFont={overlayFont}
            overlayColor={overlayColor}
            fontPresets={fontPresets}
            eventTitle={title || t('untitledTitle')}
            onOverlayChange={(next) => {
              form.setValue('cover_overlay_enabled', next.enabled, {
                shouldDirty: true,
              })
              form.setValue('cover_overlay_text', next.text || null, {
                shouldDirty: true,
              })
              form.setValue('cover_overlay_font_id', next.fontPresetId, {
                shouldDirty: true,
              })
              form.setValue('cover_overlay_color', next.color, {
                shouldDirty: true,
              })
            }}
          />
        </section>

        {/* Danger zone — edit mode only. The deletion path lives at the
            BOTTOM of the editor (well below save/publish) so it can't be
            mis-tapped while configuring the event. */}
        {mode === 'edit' && initialEvent && (
          <DangerZone
            eventId={initialEvent.id}
            eventTitle={title || initialEvent.title || t('untitledTitle')}
            locale={locale}
          />
        )}
      </div>

      {/* Floating editor rail */}
      <EditorRail
        themes={themes}
        effects={effects}
        selectedTheme={selectedTheme}
        selectedEffect={selectedEffect}
        selectedColorOverride={null}
        onSelectTheme={(id) =>
          form.setValue('theme_id', id, { shouldDirty: true })
        }
        // Color override on theme isn't wired into the editor form yet
        // (events.theme_color_override exists in the schema but no form
        // field — Prompt 08.1 will add it). Ignore for now.
        onSelectColorOverride={() => {}}
        onSelectEffect={(id) =>
          form.setValue('effect_id', id, { shouldDirty: true })
        }
      />
    </form>
  )
}

// ----- Event card (left column) -------------------------------------------

type EventCardFormProps = {
  form: ReturnType<typeof useForm<EventInput>>
  title: string
  titleFontFamily: string
  fontWeight: number
  textColor: string
  selectedFont: FontPresetForPicker | null
  fontPresets: FontPresetForPicker[]
  fontPresetId: string
}

function EventCardForm({
  form,
  title,
  titleFontFamily,
  fontWeight,
  textColor,
  selectedFont,
  fontPresets,
  fontPresetId,
}: EventCardFormProps) {
  const t = useTranslations('events.editor')
  return (
    <div className="space-y-3 rounded-2xl bg-black/35 p-5 backdrop-blur-md ring-1 ring-white/10 md:p-6">
      <div className="min-w-0 space-y-3">
        {/* Editable title — input is styled as the rendered title so it
            doubles as a live preview. The visual is what gets saved. */}
        <input
          {...form.register('title')}
          type="text"
          maxLength={200}
          placeholder={t('titlePlaceholder')}
          aria-label={t('titlePlaceholder')}
          className="w-full bg-transparent text-4xl leading-tight tracking-tight outline-none placeholder:text-white/40 sm:text-5xl"
          style={{
            fontFamily: titleFontFamily,
            fontWeight,
            color: textColor,
            letterSpacing: selectedFont?.letter_spacing ?? 'normal',
            textTransform:
              (selectedFont?.text_transform as React.CSSProperties['textTransform']) ??
              'none',
          }}
        />
        {/* Type-only echo so empty input still has size — keeps caret tall.
            The `title` here is unused visually; we already render via input. */}
        {!title && selectedFont && (
          <EventTitle
            as="span"
            text=""
            fontPreset={selectedFont}
            textColor={textColor}
            className="hidden"
          />
        )}

        <FontPicker
          fontPresets={fontPresets}
          selectedFontPresetId={fontPresetId}
          onSelect={(id) =>
            form.setValue('font_preset_id', id, { shouldDirty: true })
          }
        />

        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-white/70">Title color</span>
          <ColorPicker
            value={textColor}
            onChange={(hex) =>
              form.setValue('text_color', hex, { shouldDirty: true })
            }
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

      {/* Mock fields — non-functional placeholders for fields that land in
          Prompt 08.1+. Each carries `data-todo="08.1"` so we can find them. */}
      <PlaceholderRow icon={<Calendar className="h-4 w-4" />}>
        Set a date…
      </PlaceholderRow>
      <PlaceholderRow icon={<Crown className="h-4 w-4" />}>
        Hosted by …
      </PlaceholderRow>
      <PlaceholderRow icon={<MapPin className="h-4 w-4" />}>
        Location
      </PlaceholderRow>
      <PlaceholderRow icon={<Users className="h-4 w-4" />}>
        Unlimited spots
      </PlaceholderRow>
      <PlaceholderRow icon={<DollarSign className="h-4 w-4" />}>
        Cost per person
      </PlaceholderRow>

      <div className="flex flex-wrap gap-2 pt-1" data-todo="08.2">
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

      <div
        data-todo="08.1"
        className="rounded-xl bg-black/30 p-4 text-sm text-white/40"
      >
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
    <div
      data-todo="08.1"
      className="flex items-center gap-2.5 rounded-xl bg-black/30 px-4 py-3 text-sm text-white/70"
    >
      <span className="text-white/60">{icon}</span>
      <span>{children}</span>
    </div>
  )
}

// ----- Danger zone (edit mode only) ---------------------------------------

function DangerZone({
  eventId,
  eventTitle,
  locale,
}: {
  eventId: string
  eventTitle: string
  locale: string
}) {
  const t = useTranslations('events.delete')
  return (
    <section className="mx-auto mt-12 max-w-5xl px-4 md:px-8 md:pr-28">
      <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 backdrop-blur-md md:p-6">
        <h2 className="text-sm font-medium text-rose-200">
          {t('dangerZoneTitle')}
        </h2>
        <p className="mt-1 text-xs text-rose-200/70">
          {t('dangerZoneBody')}
        </p>
        <div className="mt-4">
          <DeleteEventDialog
            eventId={eventId}
            eventTitle={eventTitle}
            locale={locale}
            onSuccess="redirect"
          >
            <Button type="button" variant="destructive" size="lg">
              <Trash2 className="h-4 w-4" />
              {t('dangerZoneButton')}
            </Button>
          </DeleteEventDialog>
        </div>
      </div>
    </section>
  )
}

// ----- Cover area (right column) ------------------------------------------

function CoverArea({
  illustrations,
  currentUrl,
  currentSource,
  onChange,
  overlayEnabled,
  overlayText,
  overlayFontId,
  overlayFont,
  overlayColor,
  fontPresets,
  eventTitle,
  onOverlayChange,
}: {
  illustrations: CoverIllustration[]
  currentUrl: string | null
  currentSource: CoverSource | null
  onChange: (url: string | null, source: CoverSource | null) => void
  overlayEnabled: boolean
  overlayText: string
  overlayFontId: string | null
  overlayFont: FontPresetForPicker | null
  overlayColor: string
  fontPresets: FontPresetForPicker[]
  eventTitle: string
  onOverlayChange: (next: {
    enabled: boolean
    text: string
    fontPresetId: string | null
    color: string
  }) => void
}) {
  return (
    <div className="space-y-4">
      <CoverImagePicker
        illustrations={illustrations}
        currentUrl={currentUrl}
        currentSource={currentSource}
        onChange={onChange}
        trigger={
          currentUrl ? (
            <button
              type="button"
              aria-label="Change cover"
              className="block w-full overflow-hidden rounded-2xl ring-1 ring-white/10 transition hover:ring-white/30"
            >
              <CoverImage
                url={currentUrl}
                alt=""
                aspect="1 / 1"
                overlayEnabled={overlayEnabled}
                overlayText={overlayText || eventTitle}
                overlayFont={overlayFont}
                overlayColor={overlayColor}
              />
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
                <span className="text-sm">Add cover image</span>
              </span>
            </button>
          )
        }
      />

      {/* Cover overlay editor — sits directly under the cover so the live
          preview above mirrors the controls below. Only shows once a cover
          is selected; an overlay without a base image is meaningless. */}
      {currentUrl && (
        <CoverOverlayEditor
          enabled={overlayEnabled}
          text={overlayText}
          fontPresetId={overlayFontId}
          color={overlayColor}
          fontPresets={fontPresets}
          eventTitle={eventTitle}
          onChange={onOverlayChange}
        />
      )}

      {/* RSVP options preview — illustrative only; live picker in Prompt 08.3 */}
      <div
        data-todo="08.3"
        className="rounded-2xl bg-black/35 p-4 backdrop-blur-md ring-1 ring-white/10"
      >
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
