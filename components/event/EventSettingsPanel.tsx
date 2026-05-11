'use client'

import { useTranslations } from 'next-intl'
import { Switch } from '@/components/ui/switch'

export type EventSettingsValues = {
  show_guest_count: boolean
  show_guest_names: boolean
  allow_maybe: boolean
  require_names: boolean
  location_hidden_until_rsvp: boolean
}

type EventSettingsPanelProps = {
  values: EventSettingsValues
  onChange: (next: Partial<EventSettingsValues>) => void
}

export function EventSettingsPanel({ values, onChange }: EventSettingsPanelProps) {
  const t = useTranslations('events.settings')

  return (
    <div className="space-y-4 rounded-2xl bg-black/30 p-4 ring-1 ring-white/10 backdrop-blur-md">
      <h3 className="text-sm font-medium text-white">{t('panelTitle')}</h3>

      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-white/50">
          {t('groupVisibility')}
        </p>
        <ToggleRow
          label={t('showGuestCountLabel')}
          subLabel={t('showGuestCountSubLabel')}
          checked={values.show_guest_count}
          onChange={(v) => onChange({ show_guest_count: v })}
        />
        <ToggleRow
          label={t('showGuestNamesLabel')}
          subLabel={t('showGuestNamesSubLabel')}
          checked={values.show_guest_names}
          onChange={(v) => onChange({ show_guest_names: v })}
        />
        <ToggleRow
          label={t('locationHiddenLabel')}
          subLabel={t('locationHiddenSubLabel')}
          checked={values.location_hidden_until_rsvp}
          onChange={(v) => onChange({ location_hidden_until_rsvp: v })}
        />
      </div>

      <div className="space-y-3 border-t border-white/10 pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-white/50">
          {t('groupRsvpForm')}
        </p>
        <ToggleRow
          label={t('allowMaybeLabel')}
          subLabel={t('allowMaybeSubLabel')}
          checked={values.allow_maybe}
          onChange={(v) => onChange({ allow_maybe: v })}
        />
        <ToggleRow
          label={t('requireNamesLabel')}
          subLabel={t('requireNamesSubLabel')}
          checked={values.require_names}
          onChange={(v) => onChange({ require_names: v })}
        />
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  subLabel,
  checked,
  onChange,
}: {
  label: string
  subLabel: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg px-1 py-1 transition-colors hover:bg-white/5">
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="text-xs text-white/60">{subLabel}</div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="mt-0.5 shrink-0"
      />
    </label>
  )
}
