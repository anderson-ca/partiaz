import { z } from 'zod'

// Shared between the EventEditorForm (client validation via zodResolver) and
// the createEvent / updateEvent Server Actions (server-side re-validation).
// Fields here are strictly the ones the editor form exposes today; later
// prompts (08.1+) extend with date/location/etc.

export const eventInputSchema = z.object({
  title: z.string().max(200).optional().nullable(),
  theme_id: z.string().uuid(),
  effect_id: z.string().uuid().nullable(),
  font_preset_id: z.string().uuid(),
  text_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  cover_image_url: z.string().url().nullable(),
  cover_image_source: z.enum(['library', 'upload']).nullable(),
})

export type EventInput = z.infer<typeof eventInputSchema>
