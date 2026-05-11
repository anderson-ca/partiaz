'use client'

import { MapPin } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type LocationInputProps = {
  nameValue: string
  addressValue: string
  onChangeName: (next: string) => void
  onChangeAddress: (next: string) => void
}

const FIELD_CLASS = cn(
  'w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white',
  'placeholder:text-white/40',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40 focus-visible:border-violet-400/60',
)

export function LocationInput({
  nameValue,
  addressValue,
  onChangeName,
  onChangeAddress,
}: LocationInputProps) {
  const t = useTranslations('events.fields')
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-xs font-medium text-white/70">
        <MapPin className="h-3.5 w-3.5" />
        {t('locationNameLabel')}
      </label>
      <Input
        type="text"
        maxLength={255}
        value={nameValue}
        onChange={(e) => onChangeName(e.target.value)}
        placeholder={t('locationNamePlaceholder')}
        className={FIELD_CLASS}
      />
      <Input
        type="text"
        maxLength={255}
        value={addressValue}
        onChange={(e) => onChangeAddress(e.target.value)}
        placeholder={t('locationAddressPlaceholder')}
        aria-label={t('locationAddressLabel')}
        className={FIELD_CLASS}
      />
    </div>
  )
}
