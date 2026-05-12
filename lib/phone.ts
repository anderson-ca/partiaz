import {
  isValidPhoneNumber,
  parsePhoneNumber,
  type CountryCode,
} from 'libphonenumber-js/min'

// `libphonenumber-js/min` is ~15 kB vs ~150 kB for the full bundle. The min
// variant covers all countries' calling codes + lengths but drops AsYouType
// formatting and a few rare metadata fields we don't need.

const DEFAULT_COUNTRY: CountryCode = 'AZ'

/**
 * Normalize a user-typed phone number to E.164 (`+994501234567`).
 *
 * Accepts both bare local digits ("50 123 45 67" — interpreted against
 * `DEFAULT_COUNTRY`) and explicit international formats ("+994 50 ..." or
 * "+1 555 ..."). Returns null when the input can't be parsed as a valid
 * phone for any country.
 */
export function normalizePhone(
  input: string,
  defaultCountry: CountryCode = DEFAULT_COUNTRY,
): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // First pass: parse as typed. Respects an explicit `+` prefix; otherwise
  // interprets the digits against `defaultCountry` (AZ).
  try {
    const parsed = parsePhoneNumber(trimmed, defaultCountry)
    if (parsed?.isValid()) return parsed.format('E.164')
  } catch {
    // fall through to the international-fallback parse below
  }

  // Fallback: user typed an international number without the leading `+`
  // (e.g. a US tester typing "5127481053"). Strip non-digits, prepend `+`,
  // and try again as a pure international parse. AZ-local numbers won't hit
  // this branch — they validate on the first pass.
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

export function isValidPhone(
  input: string,
  defaultCountry: CountryCode = DEFAULT_COUNTRY,
): boolean {
  return isValidPhoneNumber(input.trim(), defaultCountry)
}
