'use server'

import 'server-only'
import { randomUUID } from 'crypto'
import { createClient } from '@/lib/supabase/server'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

export type UploadCoverResult =
  | { ok: true; url: string }
  | { ok: false; error: 'no_file' | 'too_large' | 'bad_type' | 'unauthenticated' | 'upload_failed' }

export async function uploadCoverImage(
  formData: FormData,
): Promise<UploadCoverResult> {
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'no_file' }
  }

  if (file.size > MAX_BYTES) {
    return { ok: false, error: 'too_large' }
  }

  if (!ALLOWED_MIME.includes(file.type as (typeof ALLOWED_MIME)[number])) {
    return { ok: false, error: 'bad_type' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: 'unauthenticated' }
  }

  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${user.id}/${randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('event-covers')
    .upload(path, file, {
      contentType: file.type,
      cacheControl: '31536000',
      upsert: false,
    })

  if (uploadError) {
    return { ok: false, error: 'upload_failed' }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('event-covers').getPublicUrl(path)

  return { ok: true, url: publicUrl }
}
