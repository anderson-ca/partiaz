import { notFound, redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import {
  EventEditorForm,
  type EventEditorInitial,
} from '@/components/event/EventEditorForm'
import type { EffectRowMin } from '@/components/event/EffectPicker'
import type { FontPresetForPicker } from '@/components/event/FontPicker'
import type { CoverIllustration } from '@/components/event/cover-picker/LibraryTab'
import type { ThemeRow } from '@/lib/schemas/theme'
import { createClient } from '@/lib/supabase/server'

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/${locale}/login?next=/${locale}/events/${slug}/edit`)
  }

  const { data: event, error } = await supabase
    .from('events')
    .select(
      'id,slug,status,title,host_id,theme_id,effect_id,font_preset_id,text_color,cover_image_url,cover_image_source,cover_overlay_enabled,cover_overlay_text,cover_overlay_font_id,cover_overlay_color,starts_at,ends_at,location_text,location_address,description',
    )
    .eq('slug', slug)
    .maybeSingle()

  // notFound covers: row missing, RLS-hidden draft of another user, or any
  // query error. We deliberately don't distinguish 403 from 404 — exposing
  // "this event exists but isn't yours" is a small information leak.
  if (error || !event || event.host_id !== user.id) {
    notFound()
  }

  const [themesRes, effectsRes, fontsRes, illustrationsRes] = await Promise.all([
    supabase
      .from('themes')
      .select(
        'id,name,category,background_type,background_value,recommended_text_color,order_index',
      )
      .order('background_type')
      .order('order_index'),
    supabase
      .from('effects')
      .select('id,name,category,engine,config,order_index')
      .order('order_index'),
    supabase
      .from('font_presets')
      .select(
        'id,name,category,font_family,font_weight,letter_spacing,text_transform',
      )
      .order('category')
      .order('name'),
    supabase
      .from('cover_illustrations')
      .select('id,image_url,category')
      .order('display_order', { ascending: true }),
  ])

  const themes = (themesRes.data ?? []) as unknown as ThemeRow[]
  const effects = (effectsRes.data ?? []) as EffectRowMin[]
  const fontPresets = (fontsRes.data ?? []) as FontPresetForPicker[]
  const illustrations = (illustrationsRes.data ?? []) as CoverIllustration[]

  const initialEvent: EventEditorInitial = {
    id: event.id,
    slug: event.slug,
    status: event.status as EventEditorInitial['status'],
    title: event.title,
    theme_id: event.theme_id,
    effect_id: event.effect_id,
    font_preset_id: event.font_preset_id,
    text_color: event.text_color,
    cover_image_url: event.cover_image_url,
    cover_image_source: event.cover_image_source,
    cover_overlay_enabled: event.cover_overlay_enabled,
    cover_overlay_text: event.cover_overlay_text,
    cover_overlay_font_id: event.cover_overlay_font_id,
    cover_overlay_color: event.cover_overlay_color,
    starts_at: event.starts_at,
    ends_at: event.ends_at,
    location_text: event.location_text,
    location_address: event.location_address,
    description: event.description,
  }

  return (
    <EventEditorForm
      mode="edit"
      themes={themes}
      effects={effects}
      fontPresets={fontPresets}
      illustrations={illustrations}
      initialEvent={initialEvent}
      locale={locale}
    />
  )
}
