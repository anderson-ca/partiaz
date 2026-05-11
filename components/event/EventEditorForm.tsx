'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import type { ISourceOptions } from '@tsparticles/engine'
import { Loader2, Trash2 } from 'lucide-react'
import { createEvent, updateEvent } from '@/app/actions/events'
import { Button } from '@/components/ui/button'
import { ColorPicker } from '@/components/event/ColorPicker'
import { CoverImage } from '@/components/event/CoverImage'
import {
  CoverImagePicker,
  type CoverSource,
} from '@/components/event/CoverImagePicker'
import { CoHostManager, type CoHost } from '@/components/event/CoHostManager'
import {
  EventSettingsPanel,
  type EventSettingsValues,
} from '@/components/event/EventSettingsPanel'
import {
  GuestListPanel,
  type GuestRow,
} from '@/components/event/GuestListPanel'
import { CoverOverlayEditor } from '@/components/event/CoverOverlayEditor'
import type { CoverIllustration } from '@/components/event/cover-picker/LibraryTab'
import { DateTimePicker } from '@/components/event/DateTimePicker'
import { DeleteEventDialog } from '@/components/event/DeleteEventDialog'
import { DescriptionInput } from '@/components/event/DescriptionInput'
import { EditorRail } from '@/components/event/EditorRail'
import { LocationInput } from '@/components/event/LocationInput'
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
import type { AppLocale } from '@/lib/dates'
import { eventInputSchema, type EventInput } from '@/lib/schemas/event'
import type { ThemeRow } from '@/lib/schemas/theme'
import { cn } from '@/lib/utils'

export type EventEditorInitial = {
  id: string
  slug: string
  status: 'draft' | 'published' | 'canceled'
  title: string
  host_id: string
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
  starts_at: string | null
  ends_at: string | null
  location_text: string | null
  location_address: string | null
  description: string | null
  capacity: number | null
  show_guest_count: boolean
  show_guest_names: boolean
  allow_maybe: boolean
  require_names: boolean
  location_hidden_until_rsvp: boolean
  cohosts: CoHost[]
  guests: GuestRow[]
}

type EventEditorFormProps = {
  themes: ThemeRow[]
  effects: EffectRowMin[]
  fontPresets: FontPresetForPicker[]
  illustrations: CoverIllustration[]
  /** When editing an existing event. Omit for create mode. */
  initialEvent?: EventEditorInitial
  /** Logged-in user id. Used by CoHostManager to decide whether the viewer
   *  is the primary host (full controls) or just a co-host (leave-only). */
  currentUserId: string
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
  currentUserId,
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
          starts_at: initialEvent.starts_at,
          ends_at: initialEvent.ends_at,
          location_text: initialEvent.location_text,
          location_address: initialEvent.location_address,
          description: initialEvent.description,
          show_guest_count: initialEvent.show_guest_count,
          show_guest_names: initialEvent.show_guest_names,
          allow_maybe: initialEvent.allow_maybe,
          require_names: initialEvent.require_names,
          location_hidden_until_rsvp: initialEvent.location_hidden_until_rsvp,
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
          starts_at: null,
          ends_at: null,
          location_text: null,
          location_address: null,
          description: null,
          show_guest_count: true,
          show_guest_names: true,
          allow_maybe: true,
          require_names: true,
          location_hidden_until_rsvp: false,
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
            locale={locale}
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

        {/* Co-hosts — edit mode only. In create mode the event doesn't
            exist yet so there's nothing to attach cohosts to; we show a
            small hint there instead. */}
        {mode === 'edit' && initialEvent && (
          <CoHostsSection
            eventId={initialEvent.id}
            primaryHostId={initialEvent.host_id}
            currentUserId={currentUserId}
            cohosts={initialEvent.cohosts}
          />
        )}
        {mode === 'create' && <CoHostsCreateHint />}

        {/* Event settings — edit-mode only. Toggles save when the main
            Save button is clicked; no separate save UI on the panel. */}
        {mode === 'edit' && initialEvent && (
          <SettingsSection form={form} />
        )}
        {mode === 'create' && <SettingsCreateHint />}

        {/* Guest list panel — edit mode only (no guests exist yet on a
            never-saved draft). Available to both host and co-hosts. */}
        {mode === 'edit' && initialEvent && (
          <section className="mx-auto mt-8 max-w-5xl px-4 md:px-8 md:pr-28">
            <GuestListPanel
              guests={initialEvent.guests}
              capacity={initialEvent.capacity}
            />
          </section>
        )}

        {/* Danger zone — edit mode only AND only the primary host. Co-hosts
            can edit but not delete; the danger zone is therefore
            primary-host-only territory. */}
        {mode === 'edit' &&
          initialEvent &&
          initialEvent.host_id === currentUserId && (
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
  locale: string
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
  locale,
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

      <EventMetaFields form={form} locale={locale} />
    </div>
  )
}

// ----- Date / location / description block --------------------------------

type EventMetaFieldsProps = {
  form: ReturnType<typeof useForm<EventInput>>
  locale: string
}

function EventMetaFields({ form, locale }: EventMetaFieldsProps) {
  const t = useTranslations('events.fields')
  const tVal = useTranslations('events.validation')

  const startsAt = form.watch('starts_at') ?? null
  const endsAt = form.watch('ends_at') ?? null
  const locationText = form.watch('location_text') ?? ''
  const locationAddress = form.watch('location_address') ?? ''
  const description = form.watch('description') ?? ''
  const endsAtError = form.formState.errors.ends_at?.message
  const [showEndPicker, setShowEndPicker] = useState(() => endsAt !== null)

  const startDate = startsAt ? new Date(startsAt) : null
  const endDate = endsAt ? new Date(endsAt) : null
  const appLocale = locale as AppLocale

  const setStart = (d: Date | null) =>
    form.setValue('starts_at', d ? d.toISOString() : null, {
      shouldDirty: true,
      shouldValidate: true,
    })
  const setEnd = (d: Date | null) =>
    form.setValue('ends_at', d ? d.toISOString() : null, {
      shouldDirty: true,
      shouldValidate: true,
    })

  return (
    <div className="space-y-3 pt-2">
      <div className="space-y-2">
        <label className="text-xs font-medium text-white/70">
          {t('startLabel')}
        </label>
        <DateTimePicker
          value={startDate}
          onChange={setStart}
          variant="start"
          locale={appLocale}
          ariaLabel={t('startLabel')}
        />
        {!showEndPicker ? (
          <button
            type="button"
            onClick={() => setShowEndPicker(true)}
            className="text-xs text-white/60 transition-colors hover:text-white"
          >
            {t('addEndTime')}
          </button>
        ) : (
          <div className="space-y-1">
            <DateTimePicker
              value={endDate}
              onChange={setEnd}
              minDate={startDate ?? undefined}
              variant="end"
              locale={appLocale}
              ariaLabel={t('endLabel')}
            />
            {endsAtError && (
              <p className="text-xs text-rose-300">{tVal('endBeforeStart')}</p>
            )}
            <button
              type="button"
              onClick={() => {
                setEnd(null)
                setShowEndPicker(false)
              }}
              className="text-xs text-white/60 transition-colors hover:text-white"
            >
              {t('removeEndTime')}
            </button>
          </div>
        )}
      </div>

      <LocationInput
        nameValue={locationText}
        addressValue={locationAddress}
        onChangeName={(v) =>
          form.setValue('location_text', v, { shouldDirty: true })
        }
        onChangeAddress={(v) =>
          form.setValue('location_address', v, { shouldDirty: true })
        }
      />

      <DescriptionInput
        value={description}
        onChange={(v) =>
          form.setValue('description', v, { shouldDirty: true })
        }
      />
    </div>
  )
}

// ----- Co-hosts wrapper ---------------------------------------------------

function CoHostsSection({
  eventId,
  primaryHostId,
  currentUserId,
  cohosts,
}: {
  eventId: string
  primaryHostId: string
  currentUserId: string
  cohosts: CoHost[]
}) {
  return (
    <section className="mx-auto mt-8 max-w-5xl px-4 md:px-8 md:pr-28">
      <CoHostManager
        eventId={eventId}
        primaryHostId={primaryHostId}
        currentUserId={currentUserId}
        cohosts={cohosts}
      />
    </section>
  )
}

function CoHostsCreateHint() {
  const t = useTranslations('cohosts')
  return (
    <section className="mx-auto mt-8 max-w-5xl px-4 md:px-8 md:pr-28">
      <p className="rounded-2xl bg-black/30 p-4 text-sm text-white/60 ring-1 ring-white/10 backdrop-blur-md">
        {t('saveFirstHint')}
      </p>
    </section>
  )
}

// ----- Event settings wrapper ---------------------------------------------

function SettingsSection({
  form,
}: {
  form: ReturnType<typeof useForm<EventInput>>
}) {
  // RHF subscribes per-field; reading all five here re-renders the section
  // (and ONLY the section) when any toggle flips.
  const values: EventSettingsValues = {
    show_guest_count: form.watch('show_guest_count') ?? true,
    show_guest_names: form.watch('show_guest_names') ?? true,
    allow_maybe: form.watch('allow_maybe') ?? true,
    require_names: form.watch('require_names') ?? true,
    location_hidden_until_rsvp:
      form.watch('location_hidden_until_rsvp') ?? false,
  }
  return (
    <section className="mx-auto mt-8 max-w-5xl px-4 md:px-8 md:pr-28">
      <EventSettingsPanel
        values={values}
        onChange={(next) => {
          for (const [key, value] of Object.entries(next)) {
            form.setValue(key as keyof EventInput, value as never, {
              shouldDirty: true,
            })
          }
        }}
      />
    </section>
  )
}

function SettingsCreateHint() {
  const t = useTranslations('events.settings')
  return (
    <section className="mx-auto mt-8 max-w-5xl px-4 md:px-8 md:pr-28">
      <p className="rounded-2xl bg-black/30 p-4 text-sm text-white/60 ring-1 ring-white/10 backdrop-blur-md">
        {t('saveFirstHint')}
      </p>
    </section>
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
