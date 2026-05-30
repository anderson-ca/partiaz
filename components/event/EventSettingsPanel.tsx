'use client'

import { useTranslations } from 'next-intl'
import { PaymentMethodsForm } from '@/components/settings/PaymentMethodsForm'
import { StepperRow } from '@/components/ui/stepper-row'
import { Switch } from '@/components/ui/switch'

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
  show_payment_info: boolean
}

type EventSettingsPanelProps = {
  values: EventSettingsValues
  onChange: (next: Partial<EventSettingsValues>) => void
  /** True when the editor viewer is the event's primary host. Controls
   *  whether the inline payment-methods form (host) or the cohost note
   *  renders under the show-payment-info toggle. In create mode the
   *  viewer is always the about-to-be primary host → pass true. */
  isPrimaryHost: boolean
  /** Pre-fill for the inline payment-methods form. Bound to the editor's
   *  live state (updated via onPaymentMethodsSaved) so toggle-off/on
   *  doesn't lose unsaved or just-saved values. */
  paymentMethodsInitial: {
    iban: string
    m10_phone: string
    birbank_phone: string
  }
  /** Fired by the inline form after a successful save so the editor can
   *  update its preview-state copy. Editor preview reads from this so
   *  freshly-saved methods show in the preview surface without a refresh. */
  onPaymentMethodsSaved: (values: {
    iban: string
    m10_phone: string
    birbank_phone: string
  }) => void
}

// Plus-one cap range. Matches the DB check-constraint in [12a] migration —
// shared as a constant so the UI and any future client-side validators
// stay in sync.
const PLUS_ONE_CAP_MAX = 5

export function EventSettingsPanel({
  values,
  onChange,
  isPrimaryHost,
  paymentMethodsInitial,
  onPaymentMethodsSaved,
}: EventSettingsPanelProps) {
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
        <ToggleRow
          label={t('showPaymentInfoLabel')}
          subLabel={t('showPaymentInfoSubLabel')}
          checked={values.show_payment_info}
          onChange={(v) => onChange({ show_payment_info: v })}
        />

        {/* Inline payment-methods editor — appears nested under the toggle
            when on, so the host enters their identifiers right where they
            flipped the switch instead of being told to navigate away to
            /settings. Cohosts see a small note explaining that only the
            primary host can edit (the public page reads the primary host's
            methods, not whoever happens to be editing). */}
        {values.show_payment_info && (
          <div className="ml-2 border-l border-white/10 pl-4">
            {isPrimaryHost ? (
              <PaymentMethodsForm
                initial={paymentMethodsInitial}
                onSaved={onPaymentMethodsSaved}
              />
            ) : (
              <p className="text-xs text-white/60">
                {t('paymentMethodsCohostNote')}
              </p>
            )}
          </div>
        )}
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
          max={PLUS_ONE_CAP_MAX}
          disabled={!values.plus_one_enabled}
        />
        <StepperRow
          label={t('plusOneMaxChildrenLabel')}
          value={values.plus_one_max_children}
          onChange={(v) => onChange({ plus_one_max_children: v })}
          max={PLUS_ONE_CAP_MAX}
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

