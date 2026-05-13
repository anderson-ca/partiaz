import type { Locale } from './invite-sms'

type Args = {
  locale: Locale
  eventTitle: string
  eventCoverUrl: string | null
  eventStartsAt: Date | null
  eventLocationText: string | null
  guestName: string | null
  inviteUrl: string
  hostName: string
}

type Strings = {
  subject: (eventTitle: string) => string
  greeting: (name: string | null) => string
  invitedBy: (hostName: string) => string
  when: string
  where: string
  cta: string
  footer: string
}

const STRINGS: Record<Locale, Strings> = {
  az: {
    subject: (t) => `Dəvətnamə: ${t}`,
    greeting: (n) => (n ? `Salam, ${n}!` : 'Salam!'),
    invitedBy: (h) => `${h} sizi tədbirə dəvət edir.`,
    when: 'Vaxt',
    where: 'Yer',
    cta: 'RSVP göndər',
    footer: 'parti.az — tədbirlər üçün dəvətnamələr',
  },
  ru: {
    subject: (t) => `Приглашение: ${t}`,
    greeting: (n) => (n ? `Привет, ${n}!` : 'Привет!'),
    invitedBy: (h) => `${h} приглашает вас на мероприятие.`,
    when: 'Когда',
    where: 'Где',
    cta: 'Ответить',
    footer: 'parti.az — приглашения на мероприятия',
  },
  en: {
    subject: (t) => `You're invited: ${t}`,
    greeting: (n) => (n ? `Hi ${n},` : 'Hi,'),
    invitedBy: (h) => `${h} is inviting you to an event.`,
    when: 'When',
    where: 'Where',
    cta: 'RSVP',
    footer: 'parti.az — invitations made easy',
  },
}

// Minimal HTML escape — guards the dynamic fields we drop into the
// template. Subject lines go through Resend directly so no escaping there;
// the URL is safe by construction (slug + nanoid).
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatWhen(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Build the invite email. Plain HTML string, inline styles only — no
 * `<style>` block, no external CSS. Gmail / Outlook / iOS Mail compat is
 * the floor here; the table-based CTA button is the bulletproof pattern
 * that works even in Outlook 2007.
 */
export function inviteEmail({
  locale,
  eventTitle,
  eventCoverUrl,
  eventStartsAt,
  eventLocationText,
  guestName,
  inviteUrl,
  hostName,
}: Args): { subject: string; html: string } {
  const s = STRINGS[locale]
  const subject = s.subject(eventTitle)
  const whenText = eventStartsAt ? formatWhen(eventStartsAt, locale) : null

  const cover = eventCoverUrl
    ? `<img src="${esc(eventCoverUrl)}" alt="" style="display:block;width:100%;max-width:560px;height:auto;border-radius:12px;margin:0 0 24px 0;" />`
    : ''

  const whenRow = whenText
    ? `<p style="margin:8px 0;color:#374151;font-size:14px;"><strong style="color:#111827;">${s.when}:</strong> ${esc(whenText)}</p>`
    : ''

  const whereRow = eventLocationText
    ? `<p style="margin:8px 0;color:#374151;font-size:14px;"><strong style="color:#111827;">${s.where}:</strong> ${esc(eventLocationText)}</p>`
    : ''

  // Bulletproof button: table wrapper so Outlook honors width + padding.
  const button = `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
  <tr>
    <td style="background:#7c3aed;border-radius:9999px;">
      <a href="${esc(inviteUrl)}" style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;">${s.cta}</a>
    </td>
  </tr>
</table>`.trim()

  const html = `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8" />
<title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:32px;">
<tr><td>
${cover}
<h1 style="margin:0 0 16px 0;color:#111827;font-size:24px;font-weight:700;line-height:1.3;">${esc(eventTitle)}</h1>
<p style="margin:0 0 8px 0;color:#374151;font-size:16px;">${esc(s.greeting(guestName))}</p>
<p style="margin:0 0 16px 0;color:#374151;font-size:16px;">${esc(s.invitedBy(hostName))}</p>
${whenRow}
${whereRow}
${button}
<hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 16px 0;" />
<p style="margin:0;color:#9ca3af;font-size:12px;">${esc(s.footer)}</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`

  return { subject, html }
}
