'use client'

import { Bell } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function NotificationBell({ className }: { className?: string }) {
  const t = useTranslations('nav')
  return (
    <button
      type="button"
      aria-label={t('notificationsComingSoon')}
      onClick={() => toast(t('notificationsComingSoon'))}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full text-white transition-all duration-150 hover:bg-white/10 active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40',
        className,
      )}
    >
      <Bell className="h-4 w-4" />
    </button>
  )
}
