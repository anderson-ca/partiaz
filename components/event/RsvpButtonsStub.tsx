'use client'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

// Stub. Real RSVP flow with invite tokens lands in Prompt 10. The buttons
// are styled to match Partiful's reference (large round emoji circles
// arranged horizontally) so the layout is final; only the click handler
// changes when 10 lands.

export function RsvpButtonsStub() {
  const t = useTranslations('events.public')

  function handleClick() {
    toast(t('rsvpComingSoon'))
  }

  const buttons: { emoji: string; label: string }[] = [
    { emoji: '👍', label: t('going') },
    { emoji: '🤔', label: t('maybe') },
    { emoji: '😢', label: t('cantGo') },
  ]

  return (
    <div className="flex items-start justify-center gap-4 sm:gap-6">
      {buttons.map((b) => (
        <button
          key={b.label}
          type="button"
          onClick={handleClick}
          className="group flex flex-col items-center gap-2"
        >
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl backdrop-blur-md ring-1 ring-white/15 transition group-hover:scale-105 group-hover:bg-white/20 sm:h-20 sm:w-20 sm:text-3xl"
            aria-hidden
          >
            {b.emoji}
          </span>
          <span className="text-xs text-white/80 sm:text-sm">{b.label}</span>
        </button>
      ))}
    </div>
  )
}
