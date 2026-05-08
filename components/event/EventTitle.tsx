import { cn } from '@/lib/utils'
import { fontFamilyToCssVar } from '@/lib/fonts'
import styles from './EventTitle.module.css'

export type FontPresetForRender = {
  font_family: string
  font_weight: number
  letter_spacing: string
  text_transform: string
}

export type TextEffect =
  | 'none'
  | 'gradient'
  | 'outline'
  | 'glow'
  | 'extrude'
  | 'animated_gradient'
  | 'chromatic'
  | 'warp'

type EventTitleProps = {
  text: string
  fontPreset: FontPresetForRender
  textColor: string
  textEffect?: TextEffect
  className?: string
  /** Override the rendered tag (default `h1`). */
  as?: 'h1' | 'h2' | 'h3' | 'span' | 'p'
}

const effectClass: Record<Exclude<TextEffect, 'none' | 'warp'>, string> = {
  gradient: styles.gradient,
  outline: styles.outline,
  glow: styles.glow,
  extrude: styles.extrude,
  animated_gradient: styles.animatedGradient,
  chromatic: styles.chromatic,
}

export function EventTitle({
  text,
  fontPreset,
  textColor,
  textEffect = 'none',
  className,
  as: Tag = 'h1',
}: EventTitleProps) {
  const cssVar = fontFamilyToCssVar[fontPreset.font_family] ?? '--font-inter'
  const baseStyle = {
    fontFamily: `var(${cssVar})`,
    fontWeight: fontPreset.font_weight,
    letterSpacing: fontPreset.letter_spacing,
    textTransform: fontPreset.text_transform as React.CSSProperties['textTransform'],
    color: textColor,
  } satisfies React.CSSProperties

  if (textEffect === 'warp') {
    return <WarpedText text={text} className={cn(styles.base, className)} style={baseStyle} />
  }

  const effectClassName =
    textEffect !== 'none' ? effectClass[textEffect] : undefined

  return (
    <Tag
      className={cn(styles.base, effectClassName, className)}
      style={baseStyle}
    >
      {text}
    </Tag>
  )
}

// Warp: SVG text with a turbulence + displacement-map filter. Inline because
// the displacement effect can't be expressed in pure CSS. Dimensions auto-fit
// the parent (preserveAspectRatio="xMinYMid meet") so the renderer doesn't
// need to know the text length.
function WarpedText({
  text,
  className,
  style,
}: {
  text: string
  className?: string
  style: React.CSSProperties
}) {
  const filterId = `warp-${Math.random().toString(36).slice(2, 9)}`
  return (
    <svg
      className={className}
      viewBox="0 0 600 100"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={text}
    >
      <defs>
        <filter id={filterId}>
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="6" />
        </filter>
      </defs>
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        filter={`url(#${filterId})`}
        style={{ ...style, fontSize: 64 }}
      >
        {text}
      </text>
    </svg>
  )
}
