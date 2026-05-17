'use client'

import { useTranslations } from 'next-intl'
import { Minus, Plus } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

export type EventSettingsValues = {
  show_guest_count: boolean
  show_guest_names: boolean
  allow_maybe: boolean
  require_names: boolean
  location_hidden_until_rsvp: boolean
  plus_one_enabled: boolean
  plus_one_max_adults: number
  plus_one_max_children: number
  allow_rsvp_edit: boolean
}

type EventSettingsPanelProps = {
  values: EventSettingsValues
  onChange: (next: Partial<EventSettingsValues>) => void
}

// Plus-one cap range. Matches the DB check-constraint in [12a] migration —
// shared as a constant so the UI and any future client-side validators
// stay in sync.
const PLUS_ONE_CAP_MIN = 0
const PLUS_ONE_CAP_MAX = 5

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
        <ToggleRow
          label={t('plusOneEnabledLabel')}
          subLabel={t('plusOneEnabledSubLabel')}
          checked={values.plus_one_enabled}
          onChange={(v) => onChange({ plus_one_enabled: v })}
        />
        {/* Steppers stay rendered when disabled (just visually muted +
            inert) so toggling plus-one off then back on preserves the
            host's chosen caps. */}
        <StepperRow
          label={t('plusOneMaxAdultsLabel')}
          value={values.plus_one_max_adults}
          onChange={(v) => onChange({ plus_one_max_adults: v })}
          disabled={!values.plus_one_enabled}
        />
        <StepperRow
          label={t('plusOneMaxChildrenLabel')}
          value={values.plus_one_max_children}
          onChange={(v) => onChange({ plus_one_max_children: v })}
          disabled={!values.plus_one_enabled}
        />
        <ToggleRow
          label={t('allowRsvpEditLabel')}
          subLabel={t('allowRsvpEditSubLabel')}
          checked={values.allow_rsvp_edit}
          onChange={(v) => onChange({ allow_rsvp_edit: v })}
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

function StepperRow({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: number
  onChange: (next: number) => void
  disabled: boolean
}) {
  const clamp = (n: number) =>
    Math.max(PLUS_ONE_CAP_MIN, Math.min(PLUS_ONE_CAP_MAX, n))
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-lg px-1 py-1 transition-opacity',
        disabled && 'pointer-events-none opacity-40',
      )}
    >
      <div className="min-w-0 flex-1 text-sm font-medium text-white">
        {label}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(clamp(value - 1))}
          disabled={disabled || value <= PLUS_ONE_CAP_MIN}
          aria-label={`${label} −`}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-6 text-center text-sm font-medium tabular-nums text-white">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(clamp(value + 1))}
          disabled={disabled || value >= PLUS_ONE_CAP_MAX}
          aria-label={`${label} +`}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
