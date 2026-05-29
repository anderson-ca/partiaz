import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PaymentMethodsForm } from '@/components/settings/PaymentMethodsForm'
import { createClient } from '@/lib/supabase/server'

type StoredPaymentMethods = {
  iban?: string | null
  m10_phone?: string | null
  birbank_phone?: string | null
} | null

export default async function PaymentMethodsPage({
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
    redirect(`/${locale}/login?next=/${locale}/settings/payment-methods`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('payment_methods')
    .eq('id', user.id)
    .maybeSingle()

  const stored = (profile?.payment_methods ?? null) as StoredPaymentMethods

  const t = await getTranslations('settings')

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 md:px-8">
      <header className="space-y-2">
        <Link
          href={`/${locale}/settings`}
          className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t('backToSettings')}
        </Link>
        <h1 className="text-2xl font-semibold text-white">
          {t('paymentMethods.title')}
        </h1>
        <p className="text-sm text-white/60">
          {t('paymentMethods.subtitle')}
        </p>
      </header>

      <PaymentMethodsForm
        initial={{
          iban: stored?.iban ?? '',
          m10_phone: stored?.m10_phone ?? '',
          birbank_phone: stored?.birbank_phone ?? '',
        }}
      />
    </div>
  )
}
