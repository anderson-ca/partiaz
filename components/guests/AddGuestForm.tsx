'use client'

import * as React from 'react'
import { Loader2, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { addGuest, type AddGuestResult } from '@/app/actions/guests'
import { CountrySelect } from '@/components/guests/CountrySelect'
import { Button } from '@/components/ui/button'
import {
  countryByCode,
  DEFAULT_COUNTRY,
  type SupportedCountry,
} from '@/lib/countries'
import { formatPhoneDisplay, normalizePhone } from '@/lib/phone'

type AddGuestFormProps = {
  eventId: string
}

type FieldError = Extract<AddGuestResult, { ok: false }>['error'] | null

export function AddGuestForm({ eventId }: AddGuestFormProps) {
  const t = useTranslations('events.guests')
  const router = useRouter()
  const [name, setName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [selectedCountry, setSelectedCountry] =
    React.useState<SupportedCountry>(DEFAULT_COUNTRY)
  const [error, setError] = React.useState<FieldError>(null)
  const [pending, startTransition] = React.useTransition()

  const country = countryByCode(selectedCountry)

  // Live phone preview: build the combined `+{dial}{digits}` string and
  // strict-parse against the selected country. Strict variant returns a
  // tagged result; only render when valid AND the formatted output differs
  // from what the user typed (avoids redundancy when the input already
  // matches the canonical format).
  const phonePreview = React.useMemo(() => {
    const digits = phone.replace(/\D/g, '')
    if (!digits) return null
    const combined = '+' + country.dialCode + digits
    const result = normalizePhone(combined, selectedCountry)
    if (!result.ok) return null
    const pretty = formatPhoneDisplay(result.e164)
    return pretty === phone.trim() ? null : pretty
  }, [phone, country.dialCode, selectedCountry])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      // Combine dial code + local digits BEFORE handing to the action, so
      // its server-side `normalizePhone` (permissive) parses an unambiguous
      // E.164-form string. Empty phone = empty combined string; the action
      // already treats that as "no phone provided".
      const digits = phone.replace(/\D/g, '')
      const combinedPhone = digits ? '+' + country.dialCode + digits : ''
      const result = await addGuest(eventId, {
        name,
        phone: combinedPhone,
        email,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast.success(t('addSuccess'))
      setName('')
      setPhone('')
      setEmail('')
      router.refresh()
    })
  }

  const inputClass =
    'w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-violet-400/60 focus:outline-hidden focus:ring-2 focus:ring-violet-400/40 disabled:cursor-not-allowed disabled:opacity-60'

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-2xl bg-black/30 p-4 ring-1 ring-white/10 backdrop-blur-md"
      noValidate
    >
      <header className="space-y-1">
        <h2 className="text-sm font-medium text-white">{t('addTitle')}</h2>
        <p className="text-xs text-white/60">{t('addHelper')}</p>
      </header>

      <div className="space-y-3">
        <div className="space-y-1">
          <label htmlFor="guest-name" className="text-xs text-white/70">
            {t('nameLabel')}
          </label>
          <input
            id="guest-name"
            type="text"
            value={name}
            disabled={pending}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('namePlaceholder')}
            className={inputClass}
            autoComplete="off"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="guest-phone" className="text-xs text-white/70">
            {t('phoneLabel')}
          </label>
          {/* Composite field: country selector flush-left, phone input
              flush-right. Shared appearance via matching border tokens and
              flat seam between the two halves. */}
          <div className="flex w-full">
            <CountrySelect
              value={selectedCountry}
              onChange={setSelectedCountry}
              className="rounded-r-none border-r-0"
            />
            <input
              id="guest-phone"
              type="tel"
              value={phone}
              disabled={pending}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={country.placeholderExample}
              className={`${inputClass} rounded-l-none`}
              autoComplete="off"
              inputMode="tel"
            />
          </div>
          {phonePreview && (
            <p className="pt-0.5 text-xs text-white/50">{phonePreview}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="guest-email" className="text-xs text-white/70">
            {t('emailLabel')}
          </label>
          <input
            id="guest-email"
            type="email"
            value={email}
            disabled={pending}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('emailPlaceholder')}
            className={inputClass}
            autoComplete="off"
          />
        </div>
      </div>

      {error && (
        <p className="text-xs text-rose-300">{t(`errors.${error}`)}</p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="w-full sm:w-auto"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )}
        {pending ? t('adding') : t('addButton')}
      </Button>
    </form>
  )
}
