import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { EventEditorForm } from '@/components/event/EventEditorForm'
import type { EffectRowMin } from '@/components/event/EffectPicker'
import type { FontPresetForPicker } from '@/components/event/FontPicker'
import type { CoverIllustration } from '@/components/event/cover-picker/LibraryTab'
import type { StoredPaymentMethods } from '@/lib/schemas/payment'
import type { ThemeRow } from '@/lib/schemas/theme'
import { createClient } from '@/lib/supabase/server'

export default async function NewEventPage({
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
    redirect(`/${locale}/login?next=/${locale}/events/new`)
  }

  const [themesRes, effectsRes, fontsRes, illustrationsRes, profileRes] =
    await Promise.all([
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
        .order('order_index'),
      supabase
        .from('cover_illustrations')
        .select('id,image_url,category')
        .order('display_order', { ascending: true }),
      // Logged-in user's profile — surfaces in the [ux-preview-mode]
      // editor preview's HostBlock as the about-to-be host of the
      // not-yet-created event. RLS allows users to read their own row
      // via `profiles_select_self`. payment_methods also threaded
      // through so the preview's PaymentMethodsCard renders for create
      // mode the same as for edit mode.
      supabase
        .from('profiles')
        .select('display_name,avatar_url,payment_methods')
        .eq('id', user.id)
        .maybeSingle(),
    ])

  const themes = (themesRes.data ?? []) as unknown as ThemeRow[]
  const effects = (effectsRes.data ?? []) as EffectRowMin[]
  const fontPresets = (fontsRes.data ?? []) as FontPresetForPicker[]
  const illustrations = (illustrationsRes.data ?? []) as CoverIllustration[]
  const viewer = {
    display_name: profileRes.data?.display_name ?? null,
    avatar_url: profileRes.data?.avatar_url ?? null,
    payment_methods: (profileRes.data?.payment_methods ??
      null) as StoredPaymentMethods,
  }

  return (
    <EventEditorForm
      mode="create"
      themes={themes}
      effects={effects}
      fontPresets={fontPresets}
      illustrations={illustrations}
      currentUserId={user.id}
      locale={locale}
      viewer={viewer}
    />
  )
}
