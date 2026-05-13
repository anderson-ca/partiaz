export type Locale = 'az' | 'ru' | 'en'

type Args = {
  locale: Locale
  eventTitle: string
  guestName: string | null
  inviteUrl: string
}

/**
 * Build the SMS body for an invite.
 *
 * GSM-7 safe: only basic Latin + digits + the punctuation Twilio's GSM-7
 * encoder accepts without falling back to UCS-2 (which halves segment
 * capacity from 160 → 70 chars). No emoji, no curly quotes, no em-dashes —
 * tooling like Notes / iMessage substitutes those silently and an
 * apostrophe alone can flip the whole message to UCS-2.
 *
 * Russian on AZ networks goes out as UCS-2 anyway (Cyrillic isn't in the
 * GSM-7 alphabet) so the `ru` branch isn't bound by the GSM-7 character
 * set — but we still keep emoji out and prefer concision since UCS-2's
 * 70-char single-segment limit is even tighter.
 *
 * Target shape: short greeting (optional) + invite line + URL. URL is
 * always last so the recipient's tap-to-open is unambiguous.
 */
export function inviteSmsBody({
  locale,
  eventTitle,
  guestName,
  inviteUrl,
}: Args): string {
  const name = guestName?.trim() || null

  if (locale === 'az') {
    // "Salam[, Leyla]! {eventTitle} tedbirine devetlisiniz. Cavab: {url}"
    // Transliterated AZ — GSM-7 compatible. The Azerbaijani Latin alphabet
    // uses ə/ş/ç/ğ/ü/ö which DO fall outside basic GSM-7; transliteration
    // (e->e, ş->sh, ç->ch, ğ->g, ü->u, ö->o) keeps us single-segment. AZ
    // mobile users read transliterated SMS routinely.
    const greeting = name ? `Salam, ${name}!` : 'Salam!'
    return `${greeting} ${eventTitle} tedbirine devetlisiniz. Cavab: ${inviteUrl}`
  }

  if (locale === 'ru') {
    // Cyrillic = UCS-2 segment, so we keep it short. ~70 char target.
    const greeting = name ? `Привет, ${name}!` : 'Привет!'
    return `${greeting} Вас приглашают: ${eventTitle}. RSVP: ${inviteUrl}`
  }

  // en
  const greeting = name ? `Hi ${name},` : 'Hi,'
  return `${greeting} you're invited to ${eventTitle}. RSVP: ${inviteUrl}`
}
