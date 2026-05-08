import { customAlphabet } from 'nanoid'

// 6 chars from a 56-char alphabet ≈ 30 billion possibilities. Collision rate
// negligible. Excludes ambiguous chars (0/O, 1/l/I) for clean shareable URLs.
const alphabet =
  '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

export const generateSlug = customAlphabet(alphabet, 6)
