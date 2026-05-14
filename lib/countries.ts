// Curated country list for the guest-add phone-input prefix selector.
// Order is intentional — AZ first (primary audience), then a tight set of
// realistic guest origins for Baku events. NOT a generic country list:
// adding entries here means a new i18n key per locale and a new placeholder
// pattern, so keep it short and intentional.
//
// Pure data, no React, no I/O — safe to import from server modules
// (`lib/phone.ts`, server actions) AND client components (CountrySelect,
// AddGuestForm).

export type SupportedCountry = 'AZ' | 'RU' | 'TR' | 'GE' | 'KZ' | 'UA' | 'US'

export type Country = {
  code: SupportedCountry
  dialCode: string // without the leading `+`
  flag: string // native emoji, no library needed
  placeholderExample: string // representative local-format number for the input placeholder
}

export const COUNTRIES: readonly Country[] = [
  { code: 'AZ', dialCode: '994', flag: '🇦🇿', placeholderExample: '50 123 45 67' },
  { code: 'RU', dialCode: '7', flag: '🇷🇺', placeholderExample: '912 345 67 89' },
  { code: 'TR', dialCode: '90', flag: '🇹🇷', placeholderExample: '532 123 45 67' },
  { code: 'GE', dialCode: '995', flag: '🇬🇪', placeholderExample: '555 12 34 56' },
  { code: 'KZ', dialCode: '7', flag: '🇰🇿', placeholderExample: '771 234 56 78' },
  { code: 'UA', dialCode: '380', flag: '🇺🇦', placeholderExample: '67 123 45 67' },
  { code: 'US', dialCode: '1', flag: '🇺🇸', placeholderExample: '512 748 1053' },
] as const

export const DEFAULT_COUNTRY: SupportedCountry = 'AZ'

export function countryByCode(code: SupportedCountry): Country {
  // Linear scan — the list is short and this is called once per re-render.
  const found = COUNTRIES.find((c) => c.code === code)
  // The `SupportedCountry` type guarantees a match; the non-null assertion
  // is here purely for TS, not as a runtime claim.
  return found!
}
