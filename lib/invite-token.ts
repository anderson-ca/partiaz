import { customAlphabet } from 'nanoid'

// 24 chars from a 32-char alphabet (lowercase + digits, ambiguous chars
// stripped). ~10^36 possibilities — plenty for global uniqueness on the
// `guests.invite_token` column even if we never garbage-collect old rows.
// Lowercase-only matches the URL-safe shape we want for invite links.
const alphabet = '23456789abcdefghjkmnpqrstuvwxyz'

export const generateInviteToken = customAlphabet(alphabet, 24)
