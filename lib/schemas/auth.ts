import { z } from 'zod'

export const magicLinkSchema = z.object({
  email: z.string().email(),
})

export type MagicLinkInput = z.infer<typeof magicLinkSchema>
