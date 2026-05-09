'use client'

import { HelpCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function HelpButton({ className }: { className?: string }) {
  const t = useTranslations('nav')
  return (
    <button
      type="button"
      aria-label={t('helpComingSoon')}
      onClick={() => toast(t('helpComingSoon'))}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none',
        className,
      )}
    >
      <HelpCircle className="h-4 w-4" />
    </button>
  )
}
