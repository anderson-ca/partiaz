import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import type { ThemeRow } from '@/lib/schemas/theme'
import { DevThemesShell } from './DevThemesShell'

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
  ])

  const themes = (themesRes.data ?? []) as unknown as ThemeRow[]
  const effects = effectsRes.data ?? []
  const fonts = fontsRes.data ?? []

  return <DevThemesShell themes={themes} effects={effects} fonts={fonts} />
}
