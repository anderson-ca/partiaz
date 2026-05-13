import 'server-only'
import twilio, { type Twilio } from 'twilio'

// Lazy singleton. We don't want to instantiate the Twilio client at module
// load (build-time / cold-start cost on routes that never send SMS) — only
// when the first SMS actually goes out. Env-var presence is enforced on
// that first call.
let cached: { client: Twilio; messagingServiceSid: string } | null = null

function getClient() {
  if (cached) return cached
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID
  if (!accountSid || !authToken || !messagingServiceSid) {
    throw new Error(
      'Twilio env missing: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_MESSAGING_SERVICE_SID required.',
    )
  }
  cached = { client: twilio(accountSid, authToken), messagingServiceSid }
  return cached
}

export type SendSmsResult =
  | { ok: true; sid: string }
  | { ok: false; error: string }

/**
 * Send a single SMS through the configured Messaging Service. We send via
 * `messagingServiceSid`, NOT a `from` number — the Messaging Service handles
 * sender pool routing, country-specific sender IDs, etc.
 *
 * Twilio Messaging credentials are distinct from the Twilio Verify Service
 * used for OTP sign-in (see CLAUDE.md "phone auth"). Don't conflate them.
 */
export async function sendSms(args: {
  to: string
  body: string
}): Promise<SendSmsResult> {
  try {
    const { client, messagingServiceSid } = getClient()
    const message = await client.messages.create({
      to: args.to,
      body: args.body,
      messagingServiceSid,
    })
    return { ok: true, sid: message.sid }
  } catch (err) {
    const error =
      err instanceof Error ? err.message : 'Twilio send failed'
    return { ok: false, error }
  }
}
