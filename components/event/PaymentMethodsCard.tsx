'use client'

import * as React from 'react'
import { Copy } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { formatPhoneDisplay } from '@/lib/phone'
import {
  formatIbanForDisplay,
  type StoredPaymentMethods,
} from '@/lib/schemas/payment'
import { FLOATING_SURFACE } from '@/lib/ui/floating-surface'
import { cn } from '@/lib/utils'

type PaymentMethodsCardProps = {
  paymentMethods: StoredPaymentMethods
}

// Row order: m10 / Birbank / IBAN — local apps first, bank-rail last.
type RowKind = 'm10' | 'birbank' | 'iban'

type Row = {
  kind: RowKind
  labelKey: string
  /** Raw form copied to clipboard — E.164 phone or spaceless IBAN. */
  raw: string
  /** Display form rendered in the row. */
  display: string
}

export function PaymentMethodsCard({
  paymentMethods,
}: PaymentMethodsCardProps) {
  const t = useTranslations('events.public.payment')

  // Empty state: render nothing. If a host toggled show_payment_info on
  // without entering any methods, the slot stays invisible — better than
  // an empty card that signals "something should be here."
  if (!paymentMethods) return null

  const rows: Row[] = []
  if (paymentMethods.m10_phone) {
    rows.push({
      kind: 'm10',
      labelKey: 'methods.m10',
      raw: paymentMethods.m10_phone,
      display: formatPhoneDisplay(paymentMethods.m10_phone),
    })
  }
  if (paymentMethods.birbank_phone) {
    rows.push({
      kind: 'birbank',
      labelKey: 'methods.birbank',
      raw: paymentMethods.birbank_phone,
      display: formatPhoneDisplay(paymentMethods.birbank_phone),
    })
  }
  if (paymentMethods.iban) {
    rows.push({
      kind: 'iban',
      labelKey: 'methods.iban',
      raw: paymentMethods.iban,
      display: formatIbanForDisplay(paymentMethods.iban),
    })
  }

  if (rows.length === 0) return null

  async function handleCopy(raw: string) {
    try {
      await navigator.clipboard.writeText(raw)
      toast.success(t('copied'))
    } catch {
      // Older browsers / insecure contexts; fall back to a no-op toast
      // explaining the failure so the user doesn't think their tap was
      // ignored. Realistic on this site only when accessed over plain
      // http://, which we don't deploy.
      toast.error(t('copyFailed'))
    }
  }

  return (
    <div className={cn(FLOATING_SURFACE, 'rounded-2xl p-5')}>
      <h2 className="mb-4 text-center text-sm font-medium text-white/80">
        {t('title')}
      </h2>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li
            key={row.kind}
            className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5"
          >
            <span className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
              {t(row.labelKey)}
            </span>
            <span className="min-w-0 flex-1 truncate font-mono text-sm tracking-wider text-white">
              {row.display}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(row.raw)}
              aria-label={t('copy')}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/70 transition-all duration-150 hover:bg-white/10 hover:text-white active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40"
            >
              <Copy className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
