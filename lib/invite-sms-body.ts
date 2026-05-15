import { getTranslations } from 'next-intl/server'
import type { Locale } from './templates/invite-sms'

type Args = {
  hostName: string
  eventTitle: string
  eventStartsAt: Date | null
  inviteUrl: string
  locale: Locale
}

/**
 * Build the invite SMS body using the `invite_sms` next-intl namespace.
 *
 * Why next-intl instead of inline branches: the [11c] template was a
 * three-way if/else with hardcoded strings, which made wording reviews
 * awkward and put translation work in the wrong place. The host's profile
 * locale (NOT the request locale — the invite is composed by the host's
 * voice, not the recipient's) drives the translation.
 *
 * Shape:
 *   "{title_line}\n{date_line}\n{rsvp_cta}"     when starts_at is set
 *   "{title_line}\n{rsvp_cta}"                  when starts_at is null
 *
 * Multi-segment SMS is acceptable here (the AZ branch uses ə/ı which fall
 * outside GSM-7, forcing UCS-2 with a 70-char-per-segment cap anyway).
 * The transliterated AZ form was a [11c] compromise; we trade it for
 * proper orthography and accept the segment count cost.
 *
 * Date format: short weekday + short month + day + 24h time, formatted in
 * the host's locale via Intl.DateTimeFormat. Date is OMITTED entirely (not
 * shown as "TBD") when starts_at is null.
 */
export async function buildInviteSmsBody({
  hostName,
  eventTitle,
  eventStartsAt,
  inviteUrl,
  locale,
}: Args): Promise<string> {
  const t = await getTranslations({ locale, namespace: 'invite_sms' })

  const titleLine = t('title_line', { hostName, eventTitle })
  const rsvpCta = t('rsvp_cta', { url: inviteUrl })

  if (!eventStartsAt) {
    return `${titleLine}\n${rsvpCta}`
  }

  const formattedDate = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(eventStartsAt)

  const dateLabel = t('date_label', { formattedDate })
  return `${titleLine}\n${dateLabel}\n${rsvpCta}`
}
