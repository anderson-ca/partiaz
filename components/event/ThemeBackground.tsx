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
  className?: string
}

export function ThemeBackground({
  theme,
  colorOverride,
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
  }
}
