'use server'

import 'server-only'
import { revalidatePath } from 'next/cache'
import { eventInputSchema, type EventInput } from '@/lib/schemas/event'
import { generateSlug } from '@/lib/slug'
import { createClient } from '@/lib/supabase/server'

const PG_UNIQUE_VIOLATION = '23505'
const SLUG_RETRIES = 3

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

  // 6-char base56 collisions are vanishingly rare (~30B possibilities), but
  // a unique-violation retry costs us nothing and makes the create path
  // robust under any future slug-space contraction.
  for (let attempt = 0; attempt < SLUG_RETRIES; attempt++) {
    const slug = generateSlug()
    const { data, error } = await supabase
      .from('events')
      .insert({
        ...parsed.data,
        title: parsed.data.title || 'Untitled Event',
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

  const { error } = await supabase
    .from('events')
    .update({
      ...parsed.data,
      title: parsed.data.title || 'Untitled Event',
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

export type SetEventStatusResult =
  | { ok: true }
  | { ok: false; error: string }

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

  const { error } = await supabase
    .from('events')
    .update({ status })
    .eq('slug', slug)
    .eq('host_id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/e/${slug}`)
  revalidatePath(`/events/${slug}/edit`)
  return { ok: true }
}
