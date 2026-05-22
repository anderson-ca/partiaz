'use client'

import Image from 'next/image'
import { isVideoCoverUrl } from '@/lib/cover'
import { resizeCoverUrl, type CoverThumbSize } from '@/lib/cover-url'
import { fontFamilyToCssVar } from '@/lib/fonts'
import { cn } from '@/lib/utils'

export type CoverOverlayFont = {
  font_family: string
  font_weight: number
  letter_spacing: string | null
  text_transform: string | null
}

type CoverImageProps = {
  url: string | null
  alt?: string
  className?: string
  priority?: boolean
  /** CSS aspect-ratio, e.g. "1 / 1", "16 / 9", "4 / 5". Default 16:9. */
  aspect?: string
  /** When true (and overlayText set), draws a scrim + overlay text over the
   *  cover image. Defaults to false so dashboard cards never paint over
   *  their own EventTitle. */
  overlayEnabled?: boolean
  overlayText?: string | null
  overlayFont?: CoverOverlayFont | null
  overlayColor?: string | null
  /** Width preset for Unsplash-source rewriting ([perf-1]). Defaults to
   *  `'public'` (1200px) which matches the public event page hero. The
   *  editor preview should pass `'apply'` (800px) to avoid paying for
   *  hero-scale bytes during the in-editor preview render. Non-Unsplash
   *  URLs ignore this — the helper passes them through unchanged. */
  size?: CoverThumbSize
}

export function CoverImage({
  url,
  alt = '',
  className,
  priority = false,
  aspect = '16 / 9',
  overlayEnabled = false,
  overlayText,
  overlayFont,
  overlayColor,
  size = 'public',
}: CoverImageProps) {
  if (!url) return null

  const showOverlay = overlayEnabled && !!overlayText && overlayText.length > 0
  const overlayFontFamily = overlayFont
    ? `var(${fontFamilyToCssVar[overlayFont.font_family] ?? '--font-inter'})`
    : 'inherit'

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-xl',
        className,
      )}
      style={{ aspectRatio: aspect }}
    >
      {isVideoCoverUrl(url) ? (
        <video
          src={url}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <Image
          src={resizeCoverUrl(url, size)}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, 800px"
          className="object-cover"
          onLoad={() => {
            // [perf-audit] dev-only timestamp — marks when the
            // selected cover image actually paints. Strip after the
            // optimization round.
            if (process.env.NODE_ENV === 'development') {
              console.timeStamp('cover-preview-rendered')
            }
          }}
        />
      )}

      {showOverlay && (
        <>
          {/* Scrim — auto bottom-up gradient gives readable text on any base
              image (light, busy, low-contrast). Covers ~60% of the height. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-black/55 via-black/20 to-transparent" />
          {/* Text — lower-third center, fixed for v1 (no positioning UI). */}
          <div className="pointer-events-none absolute inset-x-4 bottom-[12%] flex justify-center">
            <span
              className="line-clamp-3 text-center text-xl leading-tight tracking-tight drop-shadow-sm sm:text-2xl md:text-3xl"
              style={{
                fontFamily: overlayFontFamily,
                fontWeight: overlayFont?.font_weight ?? 600,
                letterSpacing: overlayFont?.letter_spacing ?? 'normal',
                textTransform:
                  (overlayFont?.text_transform as React.CSSProperties['textTransform']) ??
                  'none',
                color: overlayColor ?? '#ffffff',
              }}
            >
              {overlayText}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
