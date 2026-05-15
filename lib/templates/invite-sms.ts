/**
 * Locale type shared across the invite-template surface area.
 *
 * The SMS body construction itself moved to `lib/invite-sms-body.ts` in
 * [11c.8] — it's now next-intl-driven instead of inline branches. This
 * file is kept around because the email template still imports `Locale`
 * from here and a co-located type is the right home for the shared shape.
 */
export type Locale = 'az' | 'ru' | 'en'
