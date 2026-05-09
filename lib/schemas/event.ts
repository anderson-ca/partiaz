import { z } from 'zod'

// Shared between the EventEditorForm (client validation via zodResolver) and
// the createEvent / updateEvent Server Actions (server-side re-validation).

export const eventInputSchema = z.object({
  title: z.string().max(200).optional().nullable(),
  theme_id: z.string().uuid(),
  effect_id: z.string().uuid().nullable(),
  font_preset_id: z.string().uuid(),
  text_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  cover_image_url: z.string().url().nullable(),
  // Source enum was widened in 09.81 — 'library' became 'illustration', and
  // 'gif' is new. Anything stored as 'library' was migrated server-side.
  cover_image_source: z.enum(['illustration', 'gif', 'upload']).nullable(),

  // Cover overlay text (added in 09.81). All fields are optional from the
  // form; the Server Action normalizes them so that when `enabled === false`
  // the other three are written as null, and when `enabled === true` and
  // `text` is empty the action defaults it to the event title.
  cover_overlay_enabled: z.boolean().optional(),
  cover_overlay_text: z.string().max(200).nullable().optional(),
  cover_overlay_font_id: z.string().uuid().nullable().optional(),
  cover_overlay_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable()
    .optional(),
})

export type EventInput = z.infer<typeof eventInputSchema>
