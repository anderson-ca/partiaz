import { z } from 'zod'
import { normalizePhone } from '@/lib/phone'

// ─── IBAN checksum (ISO 7064 mod-97-10) ────────────────────────────────────
// Inline implementation; no npm dep. Chunked-modulo approach to avoid BigInt
// or the 32-bit-integer overflow that would hit if we tried to parse the
// full ~32-char numeric string as a JS Number.
//
// Algorithm:
//   1. Move the first 4 chars to the end of the string.
//   2. Replace each letter with two digits (A=10, B=11, …, Z=35).
//   3. Treat the result as a base-10 integer; valid IBAN ⇒ value mod 97 === 1.
function ibanChecksumValid(iban: string): boolean {
  const rearranged = iban.slice(4) + iban.slice(0, 4)
  let remainder = 0
  for (const ch of rearranged) {
    const code = ch.charCodeAt(0)
    let digits: number | null = null
    if (code >= 48 && code <= 57) {
      // '0'..'9'
      digits = code - 48
      remainder = (remainder * 10 + digits) % 97
    } else if (code >= 65 && code <= 90) {
      // 'A'..'Z' → 10..35; each letter contributes two decimal digits
      const value = code - 55
      remainder = (remainder * 10 + Math.floor(value / 10)) % 97
      remainder = (remainder * 10 + (value % 10)) % 97
    } else {
      return false
    }
  }
  return remainder === 1
}

// ─── Field schemas ─────────────────────────────────────────────────────────
// Each field accepts a user-typed string, normalizes it, validates, and
// stores the canonical form (uppercased & spaceless IBAN; E.164 phone).
// Empty / whitespace-only input is treated as "not provided" — the wrapping
// `.optional()` then allows the omission.

const stripEmpty = (v: unknown): unknown =>
  typeof v === 'string' && v.trim() === '' ? undefined : v

const azIbanField = z.preprocess(
  stripEmpty,
  z
    .string()
    .transform((s, ctx) => {
      const normalized = s.replace(/\s+/g, '').toUpperCase()
      if (!/^AZ\d{2}[A-Z]{4}\d{20}$/.test(normalized)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'invalid_iban_format',
        })
        return z.NEVER
      }
      if (!ibanChecksumValid(normalized)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'invalid_iban_checksum',
        })
        return z.NEVER
      }
      return normalized
    })
    .optional(),
)

const azPhoneField = z.preprocess(
  stripEmpty,
  z
    .string()
    .transform((s, ctx) => {
      const result = normalizePhone(s, 'AZ')
      if (!result.ok) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'invalid_phone',
        })
        return z.NEVER
      }
      return result.e164
    })
    .optional(),
)

// ─── PaymentMethodsSchema ──────────────────────────────────────────────────
// Host's structured payment identifiers, persisted as JSONB on
// `profiles.payment_methods`. All three methods are independently optional —
// the host might only have IBAN, only m10, etc. An empty object is valid
// (the per-event `show_payment_info` toggle is what gates rendering, and the
// public card hides itself when no identifiers are set). null is also valid
// (no row written / column cleared).

export const paymentMethodsSchema = z
  .object({
    iban: azIbanField,
    m10_phone: azPhoneField,
    birbank_phone: azPhoneField,
  })
  .nullable()

export type PaymentMethods = z.infer<typeof paymentMethodsSchema>

// ─── Read-path type ────────────────────────────────────────────────────────
// Shape persisted by `updatePaymentMethods` in app/actions/profile.ts:
// either the full column is null (no methods set), or it's an object with
// every key present and values either a string or explicit null. Reading
// code uses this — distinct from the Zod-inferred `PaymentMethods` whose
// optional fields reflect the WRITE-side validation surface.
export type StoredPaymentMethods = {
  iban: string | null
  m10_phone: string | null
  birbank_phone: string | null
} | null

// ─── Display helpers ───────────────────────────────────────────────────────

/** Pretty-print a stored spaceless IBAN as groups of 4 for display/editing.
 *  The Zod schema strips spaces on save, so round-tripping is clean. */
export function formatIbanForDisplay(s: string): string {
  if (!s) return ''
  return s.replace(/(.{4})/g, '$1 ').trim()
}
