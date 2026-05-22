'use server'

import 'server-only'
import { randomUUID } from 'crypto'
import sharp from 'sharp'
import { createClient } from '@/lib/supabase/server'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

// Maps the claimed Content-Type to sharp's canonical format string. Used to
// cross-check the claimed MIME against the bytes-sniffed format — disagreement
// is treated as smuggling and rejected.
const MIME_TO_FORMAT: Record<(typeof ALLOWED_MIME)[number], string> = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

// Sniff-allowlist is the load-bearing security check (vs MIME_TO_FORMAT,
// which is a cross-reference for header-vs-bytes agreement).
const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp', 'gif'])

export type UploadCoverResult =
  | { ok: true; url: string }
  | {
      ok: false
      error:
        | 'no_file'
        | 'too_large'
        | 'bad_type'
        | 'unsupported_format'
        | 'mime_mismatch'
        | 'unauthenticated'
        | 'upload_failed'
    }

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

  // Cheap pre-filter — fail fast on obviously-wrong claimed MIMEs (svg+xml,
  // pdf, video, etc.) before paying the buffer-read + sharp-parse cost. The
  // byte-level sniff below is the load-bearing check.
  if (!ALLOWED_MIME.includes(file.type as (typeof ALLOWED_MIME)[number])) {
    return { ok: false, error: 'bad_type' }
  }

  // ─── Server-side magic-byte sniff + EXIF strip ([sec-1]) ──────────────
  // file.type is browser-claimed and forgeable. Sharp parses the actual
  // bytes; an SVG renamed to .png lands here as unparseable raster and
  // gets rejected before reaching Storage (where bucket-level allowed
  // MIME types are also just header-trust).
  const buffer = Buffer.from(await file.arrayBuffer())

  let detectedFormat: string | undefined
  try {
    const meta = await sharp(buffer).metadata()
    detectedFormat = meta.format
  } catch {
    return { ok: false, error: 'unsupported_format' }
  }

  if (!detectedFormat || !ALLOWED_FORMATS.has(detectedFormat)) {
    return { ok: false, error: 'unsupported_format' }
  }

  // Header-vs-bytes cross-check. Disagreement (e.g., file.type =
  // image/png but bytes are JPEG) is smuggling — reject rather than
  // silently rewrite, so a confused client gets a clear error.
  const expectedFormat =
    MIME_TO_FORMAT[file.type as (typeof ALLOWED_MIME)[number]]
  if (expectedFormat !== detectedFormat) {
    return { ok: false, error: 'mime_mismatch' }
  }

  // EXIF strip is the Critical fix. JPEG/WebP can carry GPS coords,
  // camera serial, owner name — public bucket means that's a PII leak
  // on every upload. .rotate() applies the EXIF Orientation flag to
  // pixels BEFORE the strip so portrait phone photos don't render
  // sideways after metadata removal. q90 is the perceptual sweet spot
  // at our display sizes (per [perf-1] presets: 240/800/1200 px).
  //
  // PNG/GIF pass-through: PNG tEXt chunks rarely carry PII (vs JPEG's
  // GPS), and GIF re-encode would strip animation — both are acceptable
  // residual risk for v1. The sniff above is the load-bearing defense
  // for those formats.
  let uploadBuffer: Buffer = buffer
  if (detectedFormat === 'jpeg') {
    uploadBuffer = await sharp(buffer)
      .rotate()
      .jpeg({ quality: 90 })
      .toBuffer()
  } else if (detectedFormat === 'webp') {
    uploadBuffer = await sharp(buffer)
      .rotate()
      .webp({ quality: 90 })
      .toBuffer()
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: 'unauthenticated' }
  }

  // Path extension reflects ACTUAL bytes, not the user-supplied filename.
  // Keeps the URL self-describing and the Storage object header truthful.
  const ext = detectedFormat === 'jpeg' ? 'jpg' : detectedFormat
  const path = `${user.id}/${randomUUID()}.${ext}`
  const uploadContentType = `image/${detectedFormat}`

  const { error: uploadError } = await supabase.storage
    .from('event-covers')
    .upload(path, uploadBuffer, {
      contentType: uploadContentType,
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
