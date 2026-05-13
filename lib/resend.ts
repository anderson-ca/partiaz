import 'server-only'
import { Resend } from 'resend'

const FROM = 'parti.az <[email protected]>'

let cached: Resend | null = null

function getClient() {
  if (cached) return cached
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('Resend env missing: RESEND_API_KEY required.')
  }
  cached = new Resend(apiKey)
  return cached
}

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string }

export async function sendEmail(args: {
  to: string
  subject: string
  html: string
}): Promise<SendEmailResult> {
  try {
    const client = getClient()
    const res = await client.emails.send({
      from: FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
    })
    if (res.error) {
      return { ok: false, error: res.error.message }
    }
    if (!res.data?.id) {
      return { ok: false, error: 'Resend returned no id' }
    }
    return { ok: true, id: res.data.id }
  } catch (err) {
    const error =
      err instanceof Error ? err.message : 'Resend send failed'
    return { ok: false, error }
  }
}
