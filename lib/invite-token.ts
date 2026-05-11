import { customAlphabet } from 'nanoid'

// 24 chars from a 32-char alphabet (lowercase + digits, ambiguous chars
// stripped). ~10^36 possibilities — plenty for global uniqueness on the
// `guests.invite_token` column even if we never garbage-collect old rows.
// Lowercase-only for cookie cleanliness.
const alphabet = '23456789abcdefghjkmnpqrstuvwxyz'

export const generateInviteToken = customAlphabet(alphabet, 24)

// Per-event cookie naming. Anon guests get one cookie per event so their
// identity is scoped tightly — visiting event A doesn't leak identity to
// event B.
export const COOKIE_PREFIX = 'parti_invite_'
export const COOKIE_MAX_AGE_SEC = 365 * 24 * 60 * 60
