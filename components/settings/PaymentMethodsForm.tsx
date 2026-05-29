'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  updatePaymentMethods,
  type UpdatePaymentMethodsInput,
} from '@/app/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Map Zod issue messages from the server back to i18n keys per field.
// The payment schema (lib/schemas/payment.ts) emits these three codes;
// keeping the mapping inline here makes the contract explicit at the
// form's read site.
const ERROR_TO_KEY: Record<
  string,
  Record<keyof UpdatePaymentMethodsInput, string>
> = {
  invalid_iban_format: {
    iban: 'paymentMethods.iban.error.format',
    m10_phone: '',
    birbank_phone: '',
  },
  invalid_iban_checksum: {
    iban: 'paymentMethods.iban.error.checksum',
    m10_phone: '',
    birbank_phone: '',
  },
  invalid_phone: {
    iban: '',
    m10_phone: 'paymentMethods.m10.error',
    birbank_phone: 'paymentMethods.birbank.error',
  },
}

// Pretty-print a stored spaceless IBAN as groups of 4 for editing.
// The Zod schema strips spaces on save so round-tripping is clean.
function formatIbanForDisplay(s: string): string {
  if (!s) return ''
  return s.replace(/(.{4})/g, '$1 ').trim()
}

type PaymentMethodsFormProps = {
  initial: {
    iban: string
    m10_phone: string
    birbank_phone: string
  }
}

export function PaymentMethodsForm({ initial }: PaymentMethodsFormProps) {
  const t = useTranslations('settings')

  const [iban, setIban] = React.useState(formatIbanForDisplay(initial.iban))
  const [m10, setM10] = React.useState(initial.m10_phone)
  const [birbank, setBirbank] = React.useState(initial.birbank_phone)
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof UpdatePaymentMethodsInput, string>>
  >({})
  const [pending, startTransition] = React.useTransition()

  function handleSave() {
    startTransition(async () => {
      setErrors({})
      const result = await updatePaymentMethods({
        iban,
        m10_phone: m10,
        birbank_phone: birbank,
      })
      if (!result.ok) {
        if (result.error === 'invalid_payment_methods' && result.fieldErrors) {
          // Translate each Zod-issue code to an i18n key, then to a string.
          // Unknown codes fall through to a generic per-field message — the
          // schema only emits the codes in ERROR_TO_KEY today, but defending
          // here means future schema additions don't break the form.
          const translated: Partial<
            Record<keyof UpdatePaymentMethodsInput, string>
          > = {}
          for (const [field, code] of Object.entries(result.fieldErrors)) {
            const key = ERROR_TO_KEY[code]?.[field as keyof UpdatePaymentMethodsInput]
            if (key) {
              translated[field as keyof UpdatePaymentMethodsInput] = t(key)
            } else {
              translated[field as keyof UpdatePaymentMethodsInput] = t(
                'paymentMethods.error.update',
              )
            }
          }
          setErrors(translated)
          return
        }
        toast.error(t('paymentMethods.error.update'))
        return
      }
      toast.success(t('paymentMethods.saved'))
    })
  }

  return (
    <div className="space-y-5">
      {/* IBAN */}
      <div className="space-y-1.5">
        <label
          htmlFor="iban"
          className="block text-xs font-medium text-white/70"
        >
          {t('paymentMethods.iban.label')}
        </label>
        <Input
          id="iban"
          type="text"
          autoComplete="off"
          spellCheck={false}
          disabled={pending}
          value={iban}
          onChange={(e) => {
            setIban(e.target.value)
            if (errors.iban) setErrors((x) => ({ ...x, iban: undefined }))
          }}
          placeholder={t('paymentMethods.iban.placeholder')}
          className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 font-mono text-sm tracking-wider text-white placeholder:font-sans placeholder:tracking-normal placeholder:text-white/40 focus-visible:border-violet-400/60 focus-visible:ring-2 focus-visible:ring-violet-400/40 disabled:cursor-not-allowed disabled:opacity-60"
        />
        {errors.iban && (
          <p className="text-xs text-rose-300">{errors.iban}</p>
        )}
      </div>

      {/* m10 */}
      <div className="space-y-1.5">
        <label
          htmlFor="m10"
          className="block text-xs font-medium text-white/70"
        >
          {t('paymentMethods.m10.label')}
        </label>
        <Input
          id="m10"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          disabled={pending}
          value={m10}
          onChange={(e) => {
            setM10(e.target.value)
            if (errors.m10_phone)
              setErrors((x) => ({ ...x, m10_phone: undefined }))
          }}
          placeholder={t('paymentMethods.m10.placeholder')}
          className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus-visible:border-violet-400/60 focus-visible:ring-2 focus-visible:ring-violet-400/40 disabled:cursor-not-allowed disabled:opacity-60"
        />
        {errors.m10_phone && (
          <p className="text-xs text-rose-300">{errors.m10_phone}</p>
        )}
      </div>

      {/* Birbank */}
      <div className="space-y-1.5">
        <label
          htmlFor="birbank"
          className="block text-xs font-medium text-white/70"
        >
          {t('paymentMethods.birbank.label')}
        </label>
        <Input
          id="birbank"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          disabled={pending}
          value={birbank}
          onChange={(e) => {
            setBirbank(e.target.value)
            if (errors.birbank_phone)
              setErrors((x) => ({ ...x, birbank_phone: undefined }))
          }}
          placeholder={t('paymentMethods.birbank.placeholder')}
          className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus-visible:border-violet-400/60 focus-visible:ring-2 focus-visible:ring-violet-400/40 disabled:cursor-not-allowed disabled:opacity-60"
        />
        {errors.birbank_phone && (
          <p className="text-xs text-rose-300">{errors.birbank_phone}</p>
        )}
      </div>

      <div className="pt-2">
        <Button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="w-full sm:w-auto"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {t('paymentMethods.save')}
        </Button>
      </div>
    </div>
  )
}
