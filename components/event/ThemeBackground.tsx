import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { ThemeBackgroundValue } from '@/lib/schemas/theme'

type ThemeBackgroundProps = {
  theme: {
    background_type: ThemeBackgroundValue['type']
    background_value: ThemeBackgroundValue
  }
  /**
   * Only honored for `solid` and `gradient` themes — for unsplash and pattern,
   * the photo / SVG is the background and an override would be ignored.
   */
  colorOverride?: string
  /**
   * Force poster-only rendering for video themes. Passed in surfaces where
   * autoplay is unwanted: picker grid (n thumbnails), EditorRail indicator
   * (small chip), dashboard cards (multiple events on screen at once).
   *
   * Ignored for non-video themes — has no visual effect.
   *
   * Default false. The full-bleed video background routes (public event
   * page, editor live preview, /dev/themes QA harness) leave it unset.
   */
  staticOnly?: boolean
  className?: string
}

export function ThemeBackground({
  theme,
  colorOverride,
  staticOnly = false,
  className,
}: ThemeBackgroundProps) {
  const value = theme.background_value
  const wrapperClass = cn(
    'absolute inset-0 -z-10 overflow-hidden',
    className,
  )

  switch (value.type) {
    case 'gradient':
      return (
        <div
          aria-hidden
          className={wrapperClass}
          style={{ background: colorOverride ?? value.css }}
        />
      )

    case 'solid':
      return (
        <div
          aria-hidden
          className={wrapperClass}
          style={{ background: colorOverride ?? value.color }}
        />
      )

    case 'pattern':
      return (
        <div
          aria-hidden
          className={wrapperClass}
          style={{
            backgroundColor: value.background_color,
            backgroundImage: `url(${value.svg_url})`,
            backgroundRepeat: 'repeat',
            backgroundSize: `${value.scale * 80}px`,
          }}
        />
      )

    case 'unsplash':
      return (
        <div aria-hidden className={wrapperClass}>
          <Image
            src={value.url}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: value.overlay_css }}
          />
        </div>
      )

    case 'video':
      // Static contexts (picker grid, dashboard cards, editor rail indicator)
      // — render the poster only. Autoplaying many videos at once melts
      // mobile and produces a jittery picker.
      if (staticOnly) {
        return (
          <div aria-hidden className={wrapperClass}>
            <Image
              src={value.poster}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
        )
      }
      // Full-motion contexts. The poster image renders for users with
      // `prefers-reduced-motion: reduce` (Tailwind v4 `motion-reduce:`
      // variant) — pure CSS gate, no JS state needed, so this stays a
      // Server Component. The <video> element gets `poster=…` too as a
      // first-paint placeholder until the keyframe arrives.
      return (
        <div aria-hidden className={wrapperClass}>
          <video
            src={value.src}
            poster={value.poster}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
          />
          <Image
            src={value.poster}
            alt=""
            fill
            priority
            sizes="100vw"
            className="hidden object-cover motion-reduce:block"
          />
        </div>
      )
  }
}
