import { parsePhoneNumber, type CountryCode } from 'libphonenumber-js/min'
import type { SupportedCountry } from './countries'

// `libphonenumber-js/min` is ~15 kB vs ~150 kB for the full bundle. The min
// variant covers all countries' calling codes + lengths but drops AsYouType
// formatting and a few rare metadata fields we don't need.

// Order matters: the first country whose parse produces a valid number
// wins. AZ first (primary audience), then US for the dev's own testing,
// then likely guest origins for Baku events. Overlaps between AZ mobile
// (9 digits starting 50/51/55/70/77/99) and the others are vanishingly
// rare in practice.
const DEFAULT_COUNTRIES: readonly CountryCode[] = [
  'AZ',
  'US',
  'RU',
  'TR',
  'GE',
  'UA',
]

export type StrictParseResult =
  | { ok: true; e164: string }
  | { ok: false; error: 'invalid_for_country' }

/**
 * Normalize a user-typed phone number to E.164 (`+994501234567`).
 *
 * Two modes:
 *   - **Permissive (default)** — `normalizePhone(input)` returns `string | null`.
 *     Walks DEFAULT_COUNTRIES in order, first valid wins; falls back to
 *     prepending `+` for bare-digit international. Used by bulk paste,
 *     contacts picker, OTP login — flows where the caller can't reasonably
 *     prompt for a country.
 *   - **Strict country-locked** — `normalizePhone(input, 'AZ')` returns the
 *     tagged `StrictParseResult`. Parses with the given country as the only
 *     hint, no fallback. Used by the single-add guest form where the host
 *     explicitly picked a country in the dropdown.
 */
export function normalizePhone(input: string): string | null
export function normalizePhone(
  input: string,
  country: SupportedCountry,
): StrictParseResult
export function normalizePhone(
  input: string,
  country?: SupportedCountry,
): string | null | StrictParseResult {
  const trimmed = input.trim()

  // ─── Strict path: caller picked an explicit country. No fallback. ────
  if (country) {
    if (!trimmed) return { ok: false, error: 'invalid_for_country' }
    try {
      const parsed = parsePhoneNumber(trimmed, country)
      if (parsed?.isValid()) return { ok: true, e164: parsed.format('E.164') }
    } catch {
      // fall through to error
    }
    return { ok: false, error: 'invalid_for_country' }
  }

  // ─── Permissive path: existing multi-country fallback. ───────────────
  if (!trimmed) return null

  // First passes: try each default country in order. An explicit `+` prefix
  // makes the country argument a no-op (libphonenumber-js prefers the
  // prefix), so international numbers win on the very first iteration.
  for (const c of DEFAULT_COUNTRIES) {
    try {
      const parsed = parsePhoneNumber(trimmed, c)
      if (parsed?.isValid()) return parsed.format('E.164')
    } catch {
      // try the next country
    }
  }

  // Fallback: user typed an international number without the leading `+`.
  // Strip non-digits, prepend `+`, and parse as pure international. Helps
  // for country codes outside our default list.
  if (!trimmed.startsWith('+')) {
    const digits = trimmed.replace(/\D/g, '')
    if (digits.length >= 7) {
      try {
        const parsed = parsePhoneNumber('+' + digits)
        if (parsed?.isValid()) return parsed.format('E.164')
      } catch {
        // fall through to null
      }
    }
  }
  return null
}

/**
 * Pretty-print an E.164 number for user display, e.g.
 *   "+994501234567" → "+994 50 123 45 67"
 *
 * Falls back to the raw E.164 string if parsing fails so we never render an
 * empty/undefined value in the OTP prompt.
 */
export function formatPhoneDisplay(e164: string): string {
  try {
    const parsed = parsePhoneNumber(e164)
    return parsed?.formatInternational() ?? e164
  } catch {
    return e164
  }
}

