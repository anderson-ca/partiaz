import { normalizePhone } from './phone'

export type ParsedGuest = {
  name: string | null
  phone: string | null
  email: string | null
}

export type ParseResult = {
  valid: ParsedGuest[]
  invalid: { line: string; reason: 'no_contact' }[]
}

// Permissive email match — same shape as `addGuest` uses but with stricter
// boundary chars so it can be plucked out of free-form text.
const EMAIL_REGEX = /[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/

// Phone-shaped token: starts with `+` or a digit, contains 7+ phone-friendly
// chars total, ends on a digit. Greedy on phone separators (spaces, dashes,
// parens, dots) without swallowing trailing punctuation.
const PHONE_CANDIDATE_REGEX = /\+?\d[\d\s\-().]{5,}\d/

/**
 * Split a free-form paste into `ParsedGuest` rows.
 *
 * One line = one contact. Per line: pull the email out first, then the
 * longest phone-shaped substring (validated through `normalizePhone` so it
 * inherits the [11a.1] multi-country fallback), then whatever's left is the
 * name. A line with neither valid phone nor email is `invalid`.
 *
 * Pure function: no I/O, no globals beyond the regexes above. Safe to call
 * from server actions or client components.
 */
export function parseContactsFromPaste(text: string): ParseResult {
  const valid: ParsedGuest[] = []
  const invalid: { line: string; reason: 'no_contact' }[] = []

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  for (const line of lines) {
    let remaining = line

    let email: string | null = null
    const emailMatch = remaining.match(EMAIL_REGEX)
    if (emailMatch) {
      email = emailMatch[0].toLowerCase()
      remaining = (remaining.slice(0, emailMatch.index) +
        remaining.slice(emailMatch.index! + emailMatch[0].length)).trim()
    }

    let phone: string | null = null
    const phoneMatch = remaining.match(PHONE_CANDIDATE_REGEX)
    if (phoneMatch) {
      const normalized = normalizePhone(phoneMatch[0])
      if (normalized) {
        phone = normalized
        remaining = (remaining.slice(0, phoneMatch.index) +
          remaining.slice(phoneMatch.index! + phoneMatch[0].length)).trim()
      }
    }

    if (!phone && !email) {
      invalid.push({ line, reason: 'no_contact' })
      continue
    }

    // Whatever's left = name. Collapse separator garbage (commas, semicolons,
    // pipes, tabs, repeated spaces) so the name reads cleanly.
    const name =
      remaining.replace(/[,;|\t]+/g, ' ').replace(/\s+/g, ' ').trim() || null

    valid.push({ name, phone, email })
  }

  return { valid, invalid }
}
