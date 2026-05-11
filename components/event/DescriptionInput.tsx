'use client'

import { AlignLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const MAX_DESCRIPTION_LENGTH = 2000

type DescriptionInputProps = {
  value: string
  onChange: (next: string) => void
}

export function DescriptionInput({ value, onChange }: DescriptionInputProps) {
  const t = useTranslations('events.fields')
  const used = value.length
  const overLimit = used > MAX_DESCRIPTION_LENGTH

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-xs font-medium text-white/70">
        <AlignLeft className="h-3.5 w-3.5" />
        {t('descriptionLabel')}
      </label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('descriptionPlaceholder')}
        rows={4}
        className={cn(
          'w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white',
          'placeholder:text-white/40',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40 focus-visible:border-violet-400/60',
          overLimit && 'border-rose-400/60 focus-visible:ring-rose-400/40',
        )}
      />
      <p
        className={cn(
          'text-right text-[10px] tabular-nums',
          overLimit ? 'text-rose-300' : 'text-white/40',
        )}
      >
        {t('descriptionCharCount', { used, max: MAX_DESCRIPTION_LENGTH })}
      </p>
    </div>
  )
}
