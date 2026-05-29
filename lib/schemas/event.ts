import { z } from 'zod'

// Shared between the EventEditorForm (client validation via zodResolver) and
// the createEvent / updateEvent Server Actions (server-side re-validation).

// ISO 8601 timestamp — `new Date(iso).toISOString()` shape that React Hook
// Form will produce after the DateTimePicker sets a `Date` and we serialize
// it. We coerce nullable here so empty drafts validate cleanly.
const isoTimestamp = z
  .string()
  .datetime({ offset: true })
  .nullable()
  .optional()

export const eventInputSchema = z
  .object({
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

    // Date/location/description — added in 09.84. All nullable so drafts can
    // be saved without them; `starts_at` becomes required only when status
    // flips from 'draft' → 'published' (enforced in app/actions/events.ts).
    starts_at: isoTimestamp,
    ends_at: isoTimestamp,
    // 500-cap (was 255) to accommodate Google Places formatted addresses
    // for Azerbaijani street + district + region combinations — sometimes
    // 150+ chars. DB column is plain `text` (unbounded), so this is the
    // only enforcement boundary.
    location_text: z.string().max(500).nullable().optional(),
    location_address: z.string().max(500).nullable().optional(),
    // HTTP-boundary sanity guard against multi-MB payloads. The real
    // 2000-char limit is enforced post-sanitization on plain-text length
    // in app/actions/events.ts (HTML overhead means a 2000-char plain-text
    // description can land at ~7-8KB HTML; 10KB gives reasonable headroom).
    description: z.string().max(10000).nullable().optional(),

    // Event-settings booleans (added in 10.1 — schema columns existed since
    // Prompt 03 but were unwired). All optional so updateEvent calls that
    // don't touch settings leave them untouched on the server side.
    show_guest_count: z.boolean().optional(),
    show_guest_names: z.boolean().optional(),
    allow_maybe: z.boolean().optional(),
    require_names: z.boolean().optional(),
    location_hidden_until_rsvp: z.boolean().optional(),

    // Plus-one + RSVP edit policy (added in 12a). Adult/child caps share
    // the 0..5 ceiling enforced at the DB level — the form clamps to the
    // same range. `plus_one_enabled` gates whether guests see the steppers
    // at all on the [12b] submission UI; the cap values persist across
    // toggle-off/on so the host doesn't lose their inputs.
    plus_one_enabled: z.boolean().optional(),
    plus_one_max_adults: z.number().int().min(0).max(5).optional(),
    plus_one_max_children: z.number().int().min(0).max(5).optional(),
    allow_rsvp_edit: z.boolean().optional(),

    // Payment-info display toggle (added in ui-8.1). Per-event opt-in to
    // surface the host's structured payment methods (IBAN, m10, Birbank
    // — stored on profiles.payment_methods) on the public event page.
    // `.optional()` to match the surrounding settings pattern: updateEvent
    // calls that don't touch this field leave the DB value untouched.
    show_payment_info: z.boolean().optional(),
  })
  // Cross-field: end must come after start. The check tolerates either
  // value being null (drafts in progress); only enforces ordering when both
  // are set.
  .refine(
    (v) => {
      if (!v.starts_at || !v.ends_at) return true
      return new Date(v.ends_at) > new Date(v.starts_at)
    },
    { message: 'endBeforeStart', path: ['ends_at'] },
  )

export type EventInput = z.infer<typeof eventInputSchema>
