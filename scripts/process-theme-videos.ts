#!/usr/bin/env tsx
/**
 * Process raw Pexels MP4s and upload them as theme video assets.
 *
 * Usage:
 *   pnpm process-theme-videos <input-dir> [output-dir]
 *
 * Default output-dir: ./.theme-videos-output (gitignored)
 *
 * Requires:
 *   - ffmpeg on PATH (brew install ffmpeg)
 *   - .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY
 */

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, stat } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const BUCKET = 'theme-videos'
const TARGET_WIDTH = 1280
const CRF = 28
// `medium` is the encoder default and the documented sweet spot at CRF 28 —
// `slow` shaves only ~5% off file size at ~2× encode time, not worth it for
// a one-shot tooling script that re-runs on demand.
const PRESET = 'medium'
const POSTER_TIMESTAMP = '00:00:01'

// 1. Verify ffmpeg present --------------------------------------------------

async function checkFfmpeg(): Promise<void> {
  try {
    await runProcess('ffmpeg', ['-version'], { silent: true })
  } catch {
    console.error(
      'Error: ffmpeg not found on PATH. Install with: brew install ffmpeg',
    )
    process.exit(1)
  }
}

// 2. Slugify a Pexels filename ----------------------------------------------
// '6546653-hd_1920_1080_30fps.mp4' → 'pexels-6546653'
// Falls back to lowercased+hyphenated name if no leading numeric ID found.

function slugify(filename: string): string {
  const base = basename(filename, extname(filename))
  const match = base.match(/^(\d+)/)
  const id = match
    ? match[1]
    : base
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
  return `pexels-${id}`
}

// 3. Compress one video with ffmpeg, stream stderr so progress is visible ---

async function compressVideo(input: string, output: string): Promise<void> {
  // -vf scale='min(1280,iw)':-2  → cap width at 1280 but never upscale; -2
  //                                 keeps height even (libx264 needs even
  //                                 dimensions).
  // -c:v libx264 -crf 28 -preset medium  → quality knob + speed/size sweet spot.
  // -an                                  → strip audio (theme backgrounds are
  //                                         silent by design).
  // -movflags +faststart                 → moves the moov atom to the start so
  //                                         <video> can begin playback before
  //                                         the full file is buffered.
  // -y                                   → overwrite output without prompting
  //                                         (we already gate on existsSync).
  await runProcess('ffmpeg', [
    '-i',
    input,
    '-vf',
    `scale='min(${TARGET_WIDTH},iw)':-2`,
    '-c:v',
    'libx264',
    '-crf',
    String(CRF),
    '-preset',
    PRESET,
    '-an',
    '-movflags',
    '+faststart',
    '-y',
    output,
  ])
}

// 4. Extract poster image at the 1-second mark ------------------------------

async function extractPoster(input: string, output: string): Promise<void> {
  // -ss before -i would seek inaccurately on the first second; placing -ss
  // AFTER -i forces decode-accurate seek, which matters at 00:00:01.
  // -q:v 4 ≈ ~85% JPEG quality — visually clean, ~50–200 KB.
  await runProcess('ffmpeg', [
    '-i',
    input,
    '-ss',
    POSTER_TIMESTAMP,
    '-vframes',
    '1',
    '-q:v',
    '4',
    '-y',
    output,
  ])
}

// 5. Ensure bucket exists (idempotent) --------------------------------------

async function ensureBucket(supabase: SupabaseClient): Promise<void> {
  const { data: buckets, error } = await supabase.storage.listBuckets()
  if (error) throw new Error(`listBuckets failed: ${error.message}`)
  if (buckets?.some((b) => b.name === BUCKET)) return

  console.log(`Bucket "${BUCKET}" not found — creating it (public).`)
  const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
    public: true,
  })
  if (createErr) throw new Error(`createBucket failed: ${createErr.message}`)
}

// 6. Upload one file (upsert: true — re-runs replace, no duplicates) --------

async function uploadFile(
  supabase: SupabaseClient,
  localPath: string,
  storagePath: string,
  contentType: string,
): Promise<void> {
  const buf = await readFile(localPath)
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buf, { contentType, upsert: true })
  if (error) throw new Error(`upload ${storagePath} failed: ${error.message}`)
}

// Helper: run a child process and return a promise that resolves on exit 0.
// Stderr (where ffmpeg writes its progress lines) is piped through to the
// parent terminal so long encodes show real-time progress.

function runProcess(
  cmd: string,
  args: string[],
  opts: { silent?: boolean } = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: opts.silent ? 'ignore' : ['ignore', 'inherit', 'inherit'],
    })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${cmd} exited with code ${code}`))
    })
  })
}

// 7. Main loop --------------------------------------------------------------

async function main() {
  const [, , inputDir, outputDir = './.theme-videos-output'] = process.argv
  if (!inputDir) {
    console.error('Usage: pnpm process-theme-videos <input-dir> [output-dir]')
    process.exit(1)
  }

  if (!existsSync(inputDir)) {
    console.error(`Error: input directory "${inputDir}" does not exist.`)
    process.exit(1)
  }

  await checkFfmpeg()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SECRET_KEY
  if (!supabaseUrl || !supabaseKey) {
    console.error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local',
    )
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  await ensureBucket(supabase)

  await mkdir(join(outputDir, 'videos'), { recursive: true })
  await mkdir(join(outputDir, 'posters'), { recursive: true })

  const files = (await readdir(inputDir))
    .filter((f) => f.toLowerCase().endsWith('.mp4'))
    .sort()
  console.log(`Found ${files.length} MP4 files. Starting processing...\n`)

  type Result = {
    slug: string
    file: string
    videoOk: boolean
    posterOk: boolean
    error?: string
  }
  const results: Result[] = []

  for (const [i, file] of files.entries()) {
    const slug = slugify(file)
    console.log(`[${i + 1}/${files.length}] ${file}  →  ${slug}`)

    const inputPath = join(inputDir, file)
    const videoOut = join(outputDir, 'videos', `${slug}.mp4`)
    const posterOut = join(outputDir, 'posters', `${slug}.jpg`)

    try {
      if (!existsSync(videoOut)) {
        await compressVideo(inputPath, videoOut)
      } else {
        console.log('  ↳ video already compressed, skipping ffmpeg')
      }
      if (!existsSync(posterOut)) {
        await extractPoster(videoOut, posterOut)
      } else {
        console.log('  ↳ poster already extracted, skipping ffmpeg')
      }

      const videoSize = (await stat(videoOut)).size
      const posterSize = (await stat(posterOut)).size
      console.log(
        `  ↳ video: ${(videoSize / 1024 / 1024).toFixed(2)} MB, poster: ${(posterSize / 1024).toFixed(0)} KB`,
      )

      await uploadFile(supabase, videoOut, `videos/${slug}.mp4`, 'video/mp4')
      await uploadFile(
        supabase,
        posterOut,
        `posters/${slug}.jpg`,
        'image/jpeg',
      )
      console.log('  ↳ uploaded ✓\n')

      results.push({ slug, file, videoOk: true, posterOk: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`  ↳ FAILED: ${message}\n`)
      results.push({
        slug,
        file,
        videoOk: false,
        posterOk: false,
        error: message,
      })
    }
  }

  const ok = results.filter((r) => r.videoOk && r.posterOk)
  const failed = results.filter((r) => !r.videoOk || !r.posterOk)

  console.log('━'.repeat(60))
  console.log(`Done. ${ok.length} succeeded, ${failed.length} failed.\n`)

  if (failed.length > 0) {
    console.log('Failed files (re-run the script to retry):')
    for (const r of failed) console.log(`  - ${r.file}: ${r.error}`)
    console.log()
  }

  console.log('Paste-ready summary for the seed prompt:\n')
  for (const r of ok) {
    console.log(`videos/${r.slug}.mp4 + posters/${r.slug}.jpg`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
