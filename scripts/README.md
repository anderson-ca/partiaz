# Scripts

## process-theme-videos

Compresses raw Pexels MP4s and uploads them to Supabase Storage as theme video assets.

### Prerequisites

- ffmpeg installed: `brew install ffmpeg`
- `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY`

### Usage

```bash
pnpm process-theme-videos ~/Desktop/parti-videos
```

Output goes to `.theme-videos-output/` by default (gitignored). To override:

```bash
pnpm process-theme-videos ~/Desktop/parti-videos /tmp/my-output
```

### Behavior

- Compresses each `.mp4` to 720p H.264, audio stripped, CRF 28, `+faststart`
- Extracts a 1-second-mark poster JPG per video
- Uploads both to the `theme-videos` bucket on Supabase (creates the bucket as public if it doesn't exist)
- Idempotent: safe to re-run; existing local outputs are not re-compressed; uploads use `upsert: true`
- Prints a paste-ready summary at the end for the seed prompt

### Naming

Pexels filenames like `6546653-hd_1920_1080_30fps.mp4` are slugified by extracting the leading numeric ID, producing `pexels-6546653.mp4`. Files without a leading numeric ID fall back to a lowercased+hyphenated form of the full filename.

### Failure handling

A failed file is reported at the end of the run. Re-run the script with the same arguments — successful files are skipped (existing local outputs), and failed ones retry from scratch.

## prune-theme-videos

Curate the uploaded set down to a subset, using `.theme-videos-output/posters/` as the source of truth.

### Workflow

1. Run `process-theme-videos` to compress + upload all source files.
2. Open `.theme-videos-output/posters/` in Finder, set icon view, and **delete** the JPGs you don't want in the catalog.
3. Run `pnpm prune-theme-videos`. It removes:
   - the matching videos from `.theme-videos-output/videos/`
   - any video or poster in the `theme-videos` bucket whose slug is no longer in the local posters folder
4. The script prints a final paste-ready summary of what's left — that goes into the seed prompt.

### Safety

Refuses to run if the posters folder is empty (would otherwise wipe the bucket). Idempotent — safe to re-run after further deletions.
