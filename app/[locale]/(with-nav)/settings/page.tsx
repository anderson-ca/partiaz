import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronRight, Wallet } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { FLOATING_SURFACE } from '@/lib/ui/floating-surface'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

export default async function SettingsPage({
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
    redirect(`/${locale}/login?next=/${locale}/settings`)
  }

  const t = await getTranslations('settings')

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 md:px-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-white">{t('title')}</h1>
      </header>

      <ul className="space-y-2">
        <li>
          <Link
            href={`/${locale}/settings/payment-methods`}
            className={cn(
              FLOATING_SURFACE,
              'flex items-center gap-3 rounded-2xl px-4 py-3.5 text-white transition-all duration-150',
              'hover:bg-zinc-800/95 active:scale-[0.99]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40',
            )}
          >
            <Wallet className="h-5 w-5 text-white/70" />
            <span className="flex-1 text-sm font-medium">
              {t('sections.paymentMethods.label')}
            </span>
            <ChevronRight className="h-4 w-4 text-white/40" />
          </Link>
        </li>
      </ul>
    </div>
  )
}
