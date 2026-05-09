'use client'

import { Lock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { FLOATING_SURFACE } from '@/lib/ui/floating-surface'
import { cn } from '@/lib/utils'

// Renders the "Restricted Access" overlay card that appears on private
// events for non-host visitors who haven't RSVP'd. The "RSVP for access"
// CTA is a stub for v1 — Prompt 10 wires the real RSVP flow.

export function RestrictedAccessCard() {
  const t = useTranslations('events.public')

  return (
    <div
      className={cn(
        FLOATING_SURFACE,
        'rounded-2xl px-5 py-6 text-center sm:px-6',
      )}
    >
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
        <Lock className="h-5 w-5 text-white" />
      </div>
      <h3 className="text-base font-semibold text-white">
        {t('restrictedTitle')}
      </h3>
      <p className="mt-1 text-sm text-white/70">{t('restrictedBody')}</p>
      <button
        type="button"
        onClick={() => toast(t('rsvpComingSoon'))}
        className="mt-4 w-full rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white/90"
      >
        {t('restrictedCta')}
      </button>
    </div>
  )
}
