'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Phone } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  completePhoneSignup,
  sendPhoneOtp,
  verifyPhoneOtp,
} from '@/app/actions/phone-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { formatPhoneDisplay } from '@/lib/phone'
import { cn } from '@/lib/utils'

type Step = 'phone' | 'otp' | 'name'

type PhoneAuthFormProps = {
  /** Already-sanitized post-sign-in redirect target. Validated by the login
   *  page Server Component via `isSafeRelativePath`. Survives the entire
   *  phone → otp → name flow. */
  next: string | null
}

const RESEND_COOLDOWN_SEC = 30

export function PhoneAuthForm({ next }: PhoneAuthFormProps) {
  const t = useTranslations('auth.phone')
  const locale = useLocale()
  const router = useRouter()

  const [step, setStep] = React.useState<Step>('phone')
  const [phoneInput, setPhoneInput] = React.useState('')
  const [normalizedPhone, setNormalizedPhone] = React.useState<string | null>(null)
  const [otp, setOtp] = React.useState('')
  const [name, setName] = React.useState('')
  const [pending, startTransition] = React.useTransition()
  const [resendIn, setResendIn] = React.useState(0)

  // Resend cooldown: counts down once per second while resendIn > 0.
  // Cleaned up on unmount / when leaving the OTP step.
  React.useEffect(() => {
    if (step !== 'otp' || resendIn <= 0) return
    const id = setTimeout(() => setResendIn((n) => Math.max(0, n - 1)), 1000)
    return () => clearTimeout(id)
  }, [step, resendIn])

  function gotoDashboard() {
    router.push(next ?? `/${locale}/events`)
  }

  function handleSendCode() {
    startTransition(async () => {
      const result = await sendPhoneOtp(phoneInput)
      if (!result.ok) {
        toast.error(t(`errors.${result.error}`))
        return
      }
      setNormalizedPhone(result.phone)
      setStep('otp')
      setOtp('')
      setResendIn(RESEND_COOLDOWN_SEC)
    })
  }

  function handleResend() {
    if (resendIn > 0 || !normalizedPhone) return
    startTransition(async () => {
      // Re-send to the *normalized* phone we already stored, not the raw
      // input. Keeps the verify-leg call site identical to the original.
      const result = await sendPhoneOtp(normalizedPhone)
      if (!result.ok) {
        toast.error(t(`errors.${result.error}`))
        return
      }
      setResendIn(RESEND_COOLDOWN_SEC)
      setOtp('')
    })
  }

  function handleVerify() {
    if (!normalizedPhone) return
    startTransition(async () => {
      const result = await verifyPhoneOtp(normalizedPhone, otp)
      if (!result.ok) {
        toast.error(t(`errors.${result.error}`))
        return
      }
      if (result.isNewUser) {
        setStep('name')
        return
      }
      gotoDashboard()
    })
  }

  function handleCompleteSignup() {
    startTransition(async () => {
      const result = await completePhoneSignup(name)
      if (!result.ok) {
        toast.error(t(`errors.${result.error}`))
        return
      }
      gotoDashboard()
    })
  }

  function handleUseDifferentPhone() {
    setStep('phone')
    setOtp('')
    setNormalizedPhone(null)
  }

  if (step === 'phone') {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <label
            htmlFor="phone-input"
            className="block text-sm font-medium text-foreground-muted"
          >
            {t('phoneLabel')}
          </label>
          <Input
            id="phone-input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={t('phonePlaceholder')}
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && phoneInput.trim()) {
                e.preventDefault()
                handleSendCode()
              }
            }}
            className="block w-full rounded-md border border-border-default bg-surface-subtle px-3 py-2 text-base text-white placeholder:text-foreground-faint focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
          />
          <p className="text-xs text-white/60">{t('helperText')}</p>
        </div>
        <Button
          type="button"
          className="w-full"
          onClick={handleSendCode}
          disabled={pending || !phoneInput.trim()}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Phone className="h-4 w-4" />
          )}
          {pending ? t('sending') : t('sendCodeButton')}
        </Button>
      </div>
    )
  }

  if (step === 'otp') {
    return (
      <div className="space-y-3">
        <div className="space-y-1 text-center">
          <p className="text-sm text-foreground-muted">
            {t('otpSentTo', {
              phone: normalizedPhone
                ? formatPhoneDisplay(normalizedPhone)
                : '',
            })}
          </p>
          <button
            type="button"
            onClick={handleUseDifferentPhone}
            className="text-xs text-violet-300 hover:text-violet-200"
          >
            {t('useDifferentPhone')}
          </button>
        </div>

        <div className="flex justify-center py-2">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            onComplete={() => {
              // Auto-submit once all 6 digits are in.
              if (!pending) handleVerify()
            }}
          >
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot
                  key={i}
                  index={i}
                  className="h-12 w-10 border-border-default bg-surface-subtle text-white"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          type="button"
          className="w-full"
          onClick={handleVerify}
          disabled={pending || otp.length < 6}
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? t('verifying') : t('verifyButton')}
        </Button>

        <div className="text-center">
          {resendIn > 0 ? (
            <span className="text-xs text-foreground-faint">
              {t('resendAvailableIn', { seconds: resendIn })}
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={pending}
              className={cn(
                'text-xs text-violet-300 hover:text-violet-200',
                pending && 'opacity-50',
              )}
            >
              {t('resendCode')}
            </button>
          )}
        </div>
      </div>
    )
  }

  // step === 'name'
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-base font-medium text-white">{t('nameTitle')}</h2>
        <p className="text-xs text-white/60">{t('nameHelper')}</p>
      </div>
      <Input
        id="phone-name"
        type="text"
        autoComplete="name"
        maxLength={100}
        placeholder={t('namePlaceholder')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && name.trim()) {
            e.preventDefault()
            handleCompleteSignup()
          }
        }}
        className="block w-full rounded-md border border-border-default bg-surface-subtle px-3 py-2 text-base text-white placeholder:text-foreground-faint focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
      />
      <Button
        type="button"
        className="w-full"
        onClick={handleCompleteSignup}
        disabled={pending || !name.trim()}
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {pending ? t('saving') : t('continueButton')}
      </Button>
    </div>
  )
}
