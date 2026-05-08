import { Ban, Heart, Snowflake, Sparkles, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

// Hand-authored 64×64 thumbnails for each effect in the catalog. Static SVG
// scatter — no canvas, no animation — so they render identically every paint
// and cost almost nothing. Render at any size via the `size` prop; particle
// positions are percentage-based or scale via CSS so 48px (rail) and 64px
// (picker grid) both look clean.
//
// We deliberately do NOT use OpenMoji or Twemoji here. At 16-20px particle
// size, detailed emoji glyphs lose readability — stylized inline SVG reads
// better at a glance and avoids an external asset dependency.

type EffectThumbnailProps = {
  /** Effect's `name` from `public.effects` (e.g. "Snow heavy", "Emoji rain"). */
  name: string | null | undefined
  /**
   * Square size. `number` → CSS px. `string` → any CSS length ('100%', '3rem').
   * Omit to fill the parent (h-full w-full); useful when the parent is the
   * sized element (e.g. an `aspect-square w-full` grid cell).
   */
  size?: number | string
  className?: string
}

function slug(name: string | null | undefined): string {
  if (!name) return 'none'
  return name.toLowerCase().replace(/\s+/g, '-')
}

export function EffectThumbnail({
  name,
  size,
  className,
}: EffectThumbnailProps) {
  const key = slug(name)
  const Variant = VARIANTS[key] ?? UnknownThumbnail
  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full',
        size === undefined && 'h-full w-full',
        className,
      )}
      style={size !== undefined ? { width: size, height: size } : undefined}
    >
      <Variant />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Variant components — each fills its parent (absolute inset-0) so the parent
// controls size. Backgrounds use inline `radial-gradient` for pixel-precise
// control instead of Tailwind v4's `bg-radial-*` (less ambiguity).
// ---------------------------------------------------------------------------

type Variant = () => React.JSX.Element

const ABS_FILL: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
}

function FillSvg({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 64 64"
      style={ABS_FILL}
      preserveAspectRatio="xMidYMid meet"
    >
      {children}
    </svg>
  )
}

// ----- None ----------------------------------------------------------------
const NoneThumbnail: Variant = () => (
  <>
    <div
      style={{
        ...ABS_FILL,
        background: 'linear-gradient(180deg, #3f3f46 0%, #18181b 100%)',
      }}
    />
    <Ban
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '45%',
        height: '45%',
        transform: 'translate(-50%, -50%)',
        color: '#a1a1aa',
      }}
      strokeWidth={2}
    />
  </>
)

// ----- Confetti ------------------------------------------------------------
const CONFETTI_COLORS = ['#ff6b9d', '#f59e0b', '#5b8def', '#10b981', '#ffffff']
const CONFETTI_RECTS = [
  { x: 10, y: 12, rot: -25 },
  { x: 22, y: 8, rot: 40 },
  { x: 38, y: 14, rot: -10 },
  { x: 50, y: 22, rot: 55 },
  { x: 14, y: 32, rot: 70 },
  { x: 30, y: 38, rot: -45 },
  { x: 46, y: 44, rot: 20 },
  { x: 22, y: 50, rot: -60 },
] as const

const ConfettiThumbnail: Variant = () => (
  <>
    <div
      style={{
        ...ABS_FILL,
        background:
          'radial-gradient(circle at 50% 50%, #ff6b9d 0%, #6b21a8 100%)',
      }}
    />
    <FillSvg>
      {CONFETTI_RECTS.map((r, i) => (
        <rect
          key={i}
          x={r.x}
          y={r.y}
          width={4}
          height={7}
          rx={1}
          fill={CONFETTI_COLORS[i % CONFETTI_COLORS.length]}
          transform={`rotate(${r.rot} ${r.x + 2} ${r.y + 3.5})`}
        />
      ))}
    </FillSvg>
  </>
)

// ----- Snow ----------------------------------------------------------------
const SNOW_FLAKES = [
  { left: '15%', top: '15%', size: '22%', op: 1 },
  { left: '55%', top: '10%', size: '18%', op: 0.85 },
  { left: '70%', top: '40%', size: '24%', op: 1 },
  { left: '20%', top: '50%', size: '20%', op: 0.9 },
  { left: '40%', top: '65%', size: '18%', op: 0.8 },
  { left: '62%', top: '70%', size: '22%', op: 1 },
] as const

const SnowThumbnail: Variant = () => (
  <>
    <div
      style={{
        ...ABS_FILL,
        background:
          'radial-gradient(circle at 50% 35%, #475569 0%, #0f172a 100%)',
      }}
    />
    {SNOW_FLAKES.map((f, i) => (
      <Snowflake
        key={i}
        style={{
          position: 'absolute',
          left: f.left,
          top: f.top,
          width: f.size,
          height: f.size,
          color: '#ffffff',
          opacity: f.op,
        }}
        strokeWidth={1.6}
      />
    ))}
  </>
)

// ----- Hearts --------------------------------------------------------------
const HEARTS = [
  { left: '15%', top: '15%', size: '28%', rot: -18, color: '#ff4d6d' },
  { left: '55%', top: '12%', size: '22%', rot: 14, color: '#ff85a1' },
  { left: '70%', top: '45%', size: '24%', rot: -8, color: '#ff4d6d' },
  { left: '12%', top: '55%', size: '20%', rot: 22, color: '#ffafcc' },
  { left: '42%', top: '62%', size: '26%', rot: -28, color: '#ff4d6d' },
] as const

const HeartsThumbnail: Variant = () => (
  <>
    <div
      style={{
        ...ABS_FILL,
        background:
          'radial-gradient(circle at 50% 50%, #fda4af 0%, #9f1239 100%)',
      }}
    />
    {HEARTS.map((h, i) => (
      <Heart
        key={i}
        style={{
          position: 'absolute',
          left: h.left,
          top: h.top,
          width: h.size,
          height: h.size,
          color: h.color,
          fill: h.color,
          transform: `rotate(${h.rot}deg)`,
        }}
        strokeWidth={1.5}
      />
    ))}
  </>
)

// ----- Stars ---------------------------------------------------------------
const STARS = [
  { left: '14%', top: '14%', size: '24%', rot: -10 },
  { left: '60%', top: '10%', size: '20%', rot: 15 },
  { left: '70%', top: '45%', size: '24%', rot: -5 },
  { left: '20%', top: '50%', size: '20%', rot: 25 },
  { left: '42%', top: '64%', size: '22%', rot: -20 },
] as const

const StarsThumbnail: Variant = () => (
  <>
    <div
      style={{
        ...ABS_FILL,
        background:
          'radial-gradient(circle at 50% 40%, #fbbf24 0%, #78350f 100%)',
      }}
    />
    {STARS.map((s, i) => (
      <Star
        key={i}
        style={{
          position: 'absolute',
          left: s.left,
          top: s.top,
          width: s.size,
          height: s.size,
          color: '#fef3c7',
          fill: '#fde68a',
          transform: `rotate(${s.rot}deg)`,
        }}
        strokeWidth={1.5}
      />
    ))}
  </>
)

// ----- Fireworks -----------------------------------------------------------
// Radial burst from center: 12 colored lines + a small bright dot.
const FIREWORK_LINES = (() => {
  const colors = ['#ff6b9d', '#f59e0b', '#5b8def', '#10b981', '#ffffff', '#a855f7']
  const lines = []
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2
    const inner = 8
    const outer = 22
    lines.push({
      x1: 32 + Math.cos(angle) * inner,
      y1: 32 + Math.sin(angle) * inner,
      x2: 32 + Math.cos(angle) * outer,
      y2: 32 + Math.sin(angle) * outer,
      color: colors[i % colors.length],
    })
  }
  return lines
})()

const FireworksThumbnail: Variant = () => (
  <>
    <div
      style={{
        ...ABS_FILL,
        background:
          'radial-gradient(circle at 50% 50%, #1e1b4b 0%, #020617 100%)',
      }}
    />
    <FillSvg>
      {FIREWORK_LINES.map((l, i) => (
        <line
          key={i}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke={l.color}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      ))}
      {FIREWORK_LINES.map((l, i) => (
        <circle key={`d-${i}`} cx={l.x2} cy={l.y2} r={1.6} fill={l.color} />
      ))}
      <circle cx={32} cy={32} r={2.2} fill="#ffffff" />
    </FillSvg>
  </>
)

// ----- Bubbles -------------------------------------------------------------
const BUBBLES = [
  { cx: 18, cy: 20, r: 6 },
  { cx: 44, cy: 14, r: 4 },
  { cx: 52, cy: 32, r: 7 },
  { cx: 20, cy: 40, r: 5 },
  { cx: 38, cy: 48, r: 6 },
  { cx: 12, cy: 52, r: 3 },
] as const

const BubblesThumbnail: Variant = () => (
  <>
    <div
      style={{
        ...ABS_FILL,
        background:
          'radial-gradient(circle at 50% 50%, #22d3ee 0%, #1e3a8a 100%)',
      }}
    />
    <FillSvg>
      {BUBBLES.map((b, i) => (
        <g key={i}>
          <circle
            cx={b.cx}
            cy={b.cy}
            r={b.r}
            fill="#ffffff"
            fillOpacity={0.18}
            stroke="#ffffff"
            strokeOpacity={0.7}
            strokeWidth={1}
          />
          <circle
            cx={b.cx - b.r * 0.35}
            cy={b.cy - b.r * 0.35}
            r={Math.max(0.8, b.r * 0.22)}
            fill="#ffffff"
            fillOpacity={0.85}
          />
        </g>
      ))}
    </FillSvg>
  </>
)

// ----- Sparkles ------------------------------------------------------------
const SPARKLE_POSITIONS = [
  { left: '15%', top: '14%', size: '24%' },
  { left: '58%', top: '10%', size: '20%' },
  { left: '70%', top: '46%', size: '22%' },
  { left: '14%', top: '50%', size: '22%' },
  { left: '40%', top: '62%', size: '24%' },
] as const

const SparklesThumbnail: Variant = () => (
  <>
    <div
      style={{
        ...ABS_FILL,
        background:
          'radial-gradient(circle at 50% 50%, #6d28d9 0%, #2e1065 100%)',
      }}
    />
    {SPARKLE_POSITIONS.map((s, i) => (
      <Sparkles
        key={i}
        style={{
          position: 'absolute',
          left: s.left,
          top: s.top,
          width: s.size,
          height: s.size,
          color: '#ffffff',
        }}
        strokeWidth={1.5}
      />
    ))}
  </>
)

// ----- Emoji rain ----------------------------------------------------------
// Stylized "party popper" particles: triangle streamers + curls. Inline SVG
// because the OpenMoji 🎉 glyph at 16px particle size loses too much detail.
const EmojiRainThumbnail: Variant = () => (
  <>
    <div
      style={{
        ...ABS_FILL,
        background:
          'radial-gradient(circle at 50% 50%, #ec4899 0%, #7f1d1d 100%)',
      }}
    />
    <FillSvg>
      {/* triangle streamers */}
      <polygon points="14,12 19,15 16,20" fill="#fde68a" />
      <polygon points="40,10 46,13 42,18" fill="#5b8def" />
      <polygon points="50,32 56,32 52,38" fill="#10b981" />
      <polygon points="20,42 27,40 24,46" fill="#ffffff" />
      {/* spiral curls */}
      <path
        d="M 10 30 Q 14 28 12 34 Q 16 36 14 40"
        stroke="#fde68a"
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 36 48 Q 40 46 38 52 Q 42 54 40 56"
        stroke="#ffffff"
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 48 14 Q 54 12 52 18"
        stroke="#a855f7"
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
      />
    </FillSvg>
  </>
)

// ----- Petals --------------------------------------------------------------
// Almond/teardrop shape rotated to scatter.
const PETAL_PATH = 'M 0 -6 C 4 -3 4 3 0 6 C -4 3 -4 -3 0 -6 Z'
const PETALS = [
  { x: 18, y: 16, rot: -30, color: '#fda4af' },
  { x: 42, y: 14, rot: 25, color: '#fecdd3' },
  { x: 50, y: 32, rot: -10, color: '#fda4af' },
  { x: 18, y: 38, rot: 50, color: '#fb7185' },
  { x: 36, y: 46, rot: -45, color: '#fecdd3' },
  { x: 24, y: 52, rot: 15, color: '#fda4af' },
] as const

const PetalsThumbnail: Variant = () => (
  <>
    <div
      style={{
        ...ABS_FILL,
        background:
          'radial-gradient(circle at 50% 50%, #fecdd3 0%, #9f1239 100%)',
      }}
    />
    <FillSvg>
      {PETALS.map((p, i) => (
        <path
          key={i}
          d={PETAL_PATH}
          fill={p.color}
          transform={`translate(${p.x} ${p.y}) rotate(${p.rot})`}
        />
      ))}
    </FillSvg>
  </>
)

// ----- Rain ----------------------------------------------------------------
const RAIN_LINES = [
  { x: 12, y: 10, len: 8, rot: -12 },
  { x: 22, y: 18, len: 10, rot: -10 },
  { x: 32, y: 8, len: 9, rot: -14 },
  { x: 42, y: 22, len: 8, rot: -10 },
  { x: 52, y: 12, len: 10, rot: -12 },
  { x: 16, y: 36, len: 9, rot: -10 },
  { x: 36, y: 38, len: 10, rot: -12 },
  { x: 48, y: 42, len: 8, rot: -10 },
  { x: 26, y: 50, len: 9, rot: -12 },
] as const

const RainThumbnail: Variant = () => (
  <>
    <div
      style={{
        ...ABS_FILL,
        background:
          'radial-gradient(circle at 50% 30%, #475569 0%, #0f172a 100%)',
      }}
    />
    <FillSvg>
      {RAIN_LINES.map((r, i) => (
        <line
          key={i}
          x1={r.x}
          y1={r.y}
          x2={r.x + Math.sin((r.rot * Math.PI) / 180) * r.len}
          y2={r.y + Math.cos((r.rot * Math.PI) / 180) * r.len}
          stroke="#bfdbfe"
          strokeWidth={1.2}
          strokeLinecap="round"
          opacity={0.85}
        />
      ))}
    </FillSvg>
  </>
)

// ----- Embers --------------------------------------------------------------
const EMBERS = [
  { cx: 16, cy: 18, r: 1.6 },
  { cx: 28, cy: 14, r: 2.2 },
  { cx: 44, cy: 22, r: 1.4 },
  { cx: 50, cy: 38, r: 2 },
  { cx: 22, cy: 38, r: 2.4 },
  { cx: 36, cy: 48, r: 1.8 },
] as const

const EmbersThumbnail: Variant = () => (
  <>
    <div
      style={{
        ...ABS_FILL,
        background:
          'radial-gradient(circle at 50% 80%, #c2410c 0%, #450a0a 100%)',
      }}
    />
    <FillSvg>
      {EMBERS.map((e, i) => (
        <g key={i}>
          {/* glow halo */}
          <circle cx={e.cx} cy={e.cy} r={e.r * 3} fill="#ffcb52" opacity={0.18} />
          <circle cx={e.cx} cy={e.cy} r={e.r * 1.8} fill="#ff8a00" opacity={0.4} />
          {/* bright core */}
          <circle cx={e.cx} cy={e.cy} r={e.r} fill="#fde68a" />
        </g>
      ))}
    </FillSvg>
  </>
)

// ----- Balloons ------------------------------------------------------------
// Stylized inline balloons (ellipse + small triangle bottom + thin string).
function BalloonShape({
  x,
  y,
  rot,
  color,
}: {
  x: number
  y: number
  rot: number
  color: string
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <ellipse cx={0} cy={0} rx={5} ry={6.5} fill={color} />
      <polygon points="-1.4,5.8 0,8.5 1.4,5.8" fill={color} />
      <line x1={0} y1={8.5} x2={0} y2={20} stroke="#ffffff" strokeOpacity={0.7} strokeWidth={0.7} />
      {/* highlight */}
      <ellipse cx={-1.6} cy={-2} rx={1.2} ry={2} fill="#ffffff" opacity={0.45} />
    </g>
  )
}

const BalloonsThumbnail: Variant = () => (
  <>
    <div
      style={{
        ...ABS_FILL,
        background:
          'radial-gradient(circle at 50% 50%, #60a5fa 0%, #312e81 100%)',
      }}
    />
    <FillSvg>
      <BalloonShape x={18} y={18} rot={-12} color="#ff4d6d" />
      <BalloonShape x={44} y={14} rot={8} color="#fbbf24" />
      <BalloonShape x={32} y={28} rot={-4} color="#34d399" />
    </FillSvg>
  </>
)

// ----- Lights --------------------------------------------------------------
const LIGHTS = [
  { cx: 14, cy: 20, r: 2.4 },
  { cx: 28, cy: 14, r: 2 },
  { cx: 44, cy: 22, r: 2.6 },
  { cx: 52, cy: 38, r: 1.8 },
  { cx: 24, cy: 38, r: 2.2 },
  { cx: 40, cy: 48, r: 2.4 },
] as const

const LightsThumbnail: Variant = () => (
  <>
    <div
      style={{
        ...ABS_FILL,
        background:
          'radial-gradient(circle at 50% 50%, #78350f 0%, #0a0a0a 100%)',
      }}
    />
    <FillSvg>
      {LIGHTS.map((l, i) => (
        <g key={i}>
          {/* bloom */}
          <circle cx={l.cx} cy={l.cy} r={l.r * 3.2} fill="#ffd16b" opacity={0.18} />
          <circle cx={l.cx} cy={l.cy} r={l.r * 2} fill="#ffd16b" opacity={0.45} />
          {/* core */}
          <circle cx={l.cx} cy={l.cy} r={l.r} fill="#fff3b0" />
        </g>
      ))}
    </FillSvg>
  </>
)

// ----- Snow heavy ----------------------------------------------------------
const SNOW_HEAVY_FLAKES = [
  { left: '12%', top: '10%', size: '20%' },
  { left: '38%', top: '6%', size: '16%' },
  { left: '60%', top: '12%', size: '22%' },
  { left: '20%', top: '32%', size: '18%' },
  { left: '46%', top: '34%', size: '22%' },
  { left: '70%', top: '36%', size: '18%' },
  { left: '14%', top: '58%', size: '20%' },
  { left: '38%', top: '60%', size: '20%' },
  { left: '62%', top: '62%', size: '20%' },
] as const

const SnowHeavyThumbnail: Variant = () => (
  <>
    <div
      style={{
        ...ABS_FILL,
        background:
          'radial-gradient(circle at 50% 30%, #334155 0%, #020617 100%)',
      }}
    />
    {SNOW_HEAVY_FLAKES.map((f, i) => (
      <Snowflake
        key={i}
        style={{
          position: 'absolute',
          left: f.left,
          top: f.top,
          width: f.size,
          height: f.size,
          color: '#ffffff',
          opacity: 0.95,
        }}
        strokeWidth={1.6}
      />
    ))}
  </>
)

// ----- Fallback ------------------------------------------------------------
const UnknownThumbnail: Variant = () => (
  <>
    <div
      style={{
        ...ABS_FILL,
        background: 'linear-gradient(180deg, #3f3f46 0%, #18181b 100%)',
      }}
    />
    <Sparkles
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '40%',
        height: '40%',
        transform: 'translate(-50%, -50%)',
        color: '#a1a1aa',
        opacity: 0.6,
      }}
      strokeWidth={1.5}
    />
  </>
)

// Dispatcher — keys match `slug(effect.name)` for every catalog row.
const VARIANTS: Record<string, Variant> = {
  none: NoneThumbnail,
  confetti: ConfettiThumbnail,
  snow: SnowThumbnail,
  hearts: HeartsThumbnail,
  stars: StarsThumbnail,
  fireworks: FireworksThumbnail,
  bubbles: BubblesThumbnail,
  sparkles: SparklesThumbnail,
  'emoji-rain': EmojiRainThumbnail,
  petals: PetalsThumbnail,
  rain: RainThumbnail,
  embers: EmbersThumbnail,
  balloons: BalloonsThumbnail,
  lights: LightsThumbnail,
  'snow-heavy': SnowHeavyThumbnail,
}
