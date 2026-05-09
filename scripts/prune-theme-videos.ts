#!/usr/bin/env tsx
/**
 * Prune theme videos to a curated subset using the local posters folder as
 * the source of truth.
 *
 * Workflow: after running `process-theme-videos`, manually delete the poster
 * JPGs you don't want from `.theme-videos-output/posters/`. Then run this
 * script — it removes the matching videos locally and deletes both the video
 * and poster from the Supabase bucket for any slug whose poster you dropped.
 *
 * Usage:
 *   pnpm prune-theme-videos [output-dir]
 *
 * Default output-dir: ./.theme-videos-output
 *
 * Idempotent — safe to re-run.
 */

import { existsSync } from 'node:fs'
import { readdir, unlink } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const BUCKET = 'theme-videos'

async function listKeepSlugs(postersDir: string): Promise<Set<string>> {
  const files = await readdir(postersDir)
  return new Set(
    files
      .filter((f) => f.toLowerCase().endsWith('.jpg'))
      .map((f) => basename(f, extname(f))),
  )
}

async function pruneLocalVideos(
  videosDir: string,
  keep: Set<string>,
): Promise<string[]> {
  const removed: string[] = []
  const files = await readdir(videosDir)
  for (const f of files) {
    if (!f.toLowerCase().endsWith('.mp4')) continue
    const slug = basename(f, extname(f))
    if (keep.has(slug)) continue
    await unlink(join(videosDir, f))
    removed.push(f)
  }
  return removed
}

async function pruneRemote(
  supabase: SupabaseClient,
  prefix: 'videos' | 'posters',
  ext: string,
  keep: Set<string>,
): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(prefix, { limit: 1000 })
  if (error) throw new Error(`list ${prefix}/ failed: ${error.message}`)
  if (!data) return []

  const toRemove = data
    .filter((obj) => obj.name.toLowerCase().endsWith(ext))
    .filter((obj) => !keep.has(basename(obj.name, extname(obj.name))))
    .map((obj) => `${prefix}/${obj.name}`)

  if (toRemove.length === 0) return []

  const { error: rmErr } = await supabase.storage
    .from(BUCKET)
    .remove(toRemove)
  if (rmErr) throw new Error(`remove failed: ${rmErr.message}`)
  return toRemove
}

async function main() {
  const [, , outputDir = './.theme-videos-output'] = process.argv
  const postersDir = join(outputDir, 'posters')
  const videosDir = join(outputDir, 'videos')

  if (!existsSync(postersDir)) {
    console.error(`Error: posters dir "${postersDir}" does not exist.`)
    process.exit(1)
  }

  const keep = await listKeepSlugs(postersDir)
  if (keep.size === 0) {
    console.error(
      `Error: no posters found in "${postersDir}". Refusing to prune ` +
        'everything — that would wipe the bucket.',
    )
    process.exit(1)
  }

  console.log(`Keep-list: ${keep.size} slugs (from ${postersDir})\n`)

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

  // Local cleanup first — fast and lets us see what's about to leave the
  // bucket if anything looks off.
  const removedVideos = existsSync(videosDir)
    ? await pruneLocalVideos(videosDir, keep)
    : []
  console.log(`Removed ${removedVideos.length} local video file(s):`)
  for (const f of removedVideos) console.log(`  - ${f}`)
  console.log()

  // Remote cleanup — videos and posters folders independently. Posters folder
  // remote may already be in sync if you only deleted locally; that's fine,
  // the diff is what drives removal.
  const removedRemoteVideos = await pruneRemote(
    supabase,
    'videos',
    '.mp4',
    keep,
  )
  const removedRemotePosters = await pruneRemote(
    supabase,
    'posters',
    '.jpg',
    keep,
  )
  console.log(
    `Removed ${removedRemoteVideos.length} remote video(s) + ` +
      `${removedRemotePosters.length} remote poster(s).`,
  )
  for (const p of [...removedRemoteVideos, ...removedRemotePosters]) {
    console.log(`  - ${p}`)
  }
  console.log()

  console.log('━'.repeat(60))
  console.log('Final paste-ready summary for the seed prompt:\n')
  for (const slug of [...keep].sort()) {
    console.log(`videos/${slug}.mp4 + posters/${slug}.jpg`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
