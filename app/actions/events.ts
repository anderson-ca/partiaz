'use server'

import 'server-only'
import { revalidatePath } from 'next/cache'
import { getLocale } from 'next-intl/server'
import { eventInputSchema, type EventInput } from '@/lib/schemas/event'
import { generateSlug } from '@/lib/slug'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const PG_UNIQUE_VIOLATION = '23505'
const SLUG_RETRIES = 3

/**
 * Normalize the four cover_overlay_* fields:
 *   • enabled === false → all three sub-fields write as null (drops stale
 *     data so a re-toggle doesn't surface a previous-event's leftover)
 *   • enabled === true + empty text → default text to the event title at
 *     write time (avoids "enabled but no visible text" edge cases on render)
 *
 * Returns the slice ready to spread into an insert/update payload.
 */
/**
 * Empty-string → null for the free-text date/location/description fields.
 * RHF returns '' from cleared inputs; storing nulls keeps `WHERE … IS NULL`
 * queries clean and the Past-tab filter doesn't need to special-case empties.
 */
function normalizeMeta(input: EventInput) {
  const blankToNull = (s: string | null | undefined) => {
    if (s == null) return null
    const trimmed = s.trim()
    return trimmed.length === 0 ? null : trimmed
  }
  return {
    starts_at: input.starts_at ?? null,
    ends_at: input.ends_at ?? null,
    location_text: blankToNull(input.location_text),
    location_address: blankToNull(input.location_address),
    description: blankToNull(input.description),
  }
}

function normalizeOverlay(input: EventInput, fallbackTitle: string) {
  const enabled = input.cover_overlay_enabled === true
  if (!enabled) {
    return {
      cover_overlay_enabled: false,
      cover_overlay_text: null,
      cover_overlay_font_id: null,
      cover_overlay_color: null,
    }
  }
  const trimmed = (input.cover_overlay_text ?? '').trim()
  return {
    cover_overlay_enabled: true,
    cover_overlay_text: trimmed.length > 0 ? trimmed : fallbackTitle,
    cover_overlay_font_id: input.cover_overlay_font_id ?? null,
    cover_overlay_color: input.cover_overlay_color ?? null,
  }
}

export type CreateEventResult =
  | { ok: true; slug: string }
  | { ok: false; error: string }

export async function createEvent(
  input: EventInput,
): Promise<CreateEventResult> {
  const parsed = eventInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'invalid_input' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  const finalTitle = parsed.data.title || 'Untitled Event'
  const overlay = normalizeOverlay(parsed.data, finalTitle)
  const meta = normalizeMeta(parsed.data)

  // 6-char base56 collisions are vanishingly rare (~30B possibilities), but
  // a unique-violation retry costs us nothing and makes the create path
  // robust under any future slug-space contraction.
  for (let attempt = 0; attempt < SLUG_RETRIES; attempt++) {
    const slug = generateSlug()
    const { data, error } = await supabase
      .from('events')
      .insert({
        ...parsed.data,
        ...overlay,
        ...meta,
        title: finalTitle,
        host_id: user.id,
        slug,
        status: 'draft',
      })
      .select('slug')
      .single()

    if (!error) return { ok: true, slug: data.slug }
    // Retry only on slug collision; bail on any other DB error.
    if (error.code !== PG_UNIQUE_VIOLATION) {
      return { ok: false, error: error.message }
    }
  }

  return { ok: false, error: 'slug_collision_exhausted' }
}

export type UpdateEventResult =
  | { ok: true }
  | { ok: false; error: string }

export async function updateEvent(
  slug: string,
  input: EventInput,
): Promise<UpdateEventResult> {
  const parsed = eventInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'invalid_input' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  const finalTitle = parsed.data.title || 'Untitled Event'
  const overlay = normalizeOverlay(parsed.data, finalTitle)
  const meta = normalizeMeta(parsed.data)

  const { error } = await supabase
    .from('events')
    .update({
      ...parsed.data,
      ...overlay,
      ...meta,
      title: finalTitle,
    })
    .eq('slug', slug)
    // Belt-and-suspenders: RLS already enforces this, but the explicit filter
    // catches stale slugs in the URL faster than waiting for an RLS deny.
    .eq('host_id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/e/${slug}`)
  revalidatePath(`/events/${slug}/edit`)
  return { ok: true }
}

export type DeleteEventResult =
  | { ok: true }
  | { ok: false; error: 'unauthorized' | 'not_found' | 'delete_failed' }

/**
 * Hard-delete an event. RLS already restricts host-only deletes; the
 * explicit ownership check before the delete gives us clean error codes
 * instead of an opaque RLS-deny. Child tables cascade via FKs (verified
 * in supabase/migrations/20260507201716_core_schema.sql).
 *
 * Storage cleanup (uploaded covers only) runs AFTER the row delete and is
 * fail-soft — an orphaned file is far less bad than a half-deleted event.
 */
export async function deleteEvent(eventId: string): Promise<DeleteEventResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  // Fetch first to verify ownership and capture cover info for storage cleanup.
  const { data: event, error: fetchErr } = await supabase
    .from('events')
    .select('id, slug, host_id, cover_image_url, cover_image_source')
    .eq('id', eventId)
    .single()

  if (fetchErr || !event) return { ok: false, error: 'not_found' }
  if (event.host_id !== user.id) return { ok: false, error: 'unauthorized' }

  const { error: delErr } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
  if (delErr) return { ok: false, error: 'delete_failed' }

  // Storage cleanup — uploaded covers only. Library covers point at remote
  // Unsplash URLs, not at our bucket; nothing to remove. Failure here is
  // logged-and-ignored (the row is already gone; a stray file is recoverable).
  if (event.cover_image_source === 'upload' && event.cover_image_url) {
    const path = extractStoragePath(event.cover_image_url)
    if (path) {
      const service = createServiceClient()
      try {
        await service.storage.from('event-covers').remove([path])
      } catch {
        // intentionally swallowed — see comment above
      }
    }
  }

  const locale = await getLocale()
  revalidatePath(`/${locale}/events`)
  revalidatePath(`/${locale}/e/${event.slug}`)
  return { ok: true }
}

/**
 * Pulls the bucket-relative path out of a Supabase Storage public URL.
 * Pattern: https://<project>.supabase.co/storage/v1/object/public/event-covers/<path>
 * Returns null on any URL that doesn't match the expected shape.
 */
function extractStoragePath(url: string): string | null {
  try {
    const marker = '/event-covers/'
    const pathname = new URL(url).pathname
    const idx = pathname.indexOf(marker)
    return idx === -1 ? null : pathname.slice(idx + marker.length)
  } catch {
    return null
  }
}

export type SetEventStatusResult =
  | { ok: true }
  | { ok: false; error: 'invalid_status' | 'unauthenticated' | 'missing_start_at' | 'db' }

export async function setEventStatus(
  slug: string,
  status: 'draft' | 'published',
): Promise<SetEventStatusResult> {
  if (status !== 'draft' && status !== 'published') {
    return { ok: false, error: 'invalid_status' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  // Publish guard — refuse to flip draft → published without a start time.
  // The dashboard's Upcoming/Past tabs key off `starts_at`, and a published
  // event with no date would float in neither bucket. Cheap pre-check
  // beats letting the row update succeed and then having to chase the
  // dangling-date bug downstream.
  if (status === 'published') {
    const { data: row, error: fetchErr } = await supabase
      .from('events')
      .select('starts_at')
      .eq('slug', slug)
      .eq('host_id', user.id)
      .maybeSingle()
    if (fetchErr || !row) return { ok: false, error: 'db' }
    if (!row.starts_at) return { ok: false, error: 'missing_start_at' }
  }

  const { error } = await supabase
    .from('events')
    .update({ status })
    .eq('slug', slug)
    .eq('host_id', user.id)

  if (error) return { ok: false, error: 'db' }

  revalidatePath(`/e/${slug}`)
  revalidatePath(`/events/${slug}/edit`)
  return { ok: true }
}
