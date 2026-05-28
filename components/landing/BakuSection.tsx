import { getTranslations } from 'next-intl/server'

const PAYMENT_LABELS = ['m10', 'Birbank', 'IBAN'] as const

export async function BakuSection() {
  const t = await getTranslations('landing.baku')

  return (
    <section className="relative overflow-hidden px-4 pt-16 pb-24 md:px-6 md:pt-24 md:pb-32">
      {/* Softer ambient orb — different position + smaller scale than the
          hero orb so visitors register this as a "different section" without
          an explicit divider. Animation paused under prefers-reduced-motion
          via the landing-orb-ambient class in globals.css. */}
      <div
        aria-hidden
        className="landing-orb-ambient pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(closest-side, oklch(0.606 0.235 292 / 0.15) 0%, transparent 70%)',
        }}
      />

      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium tracking-[0.25em] text-foreground-faint uppercase">
          {t('label')}
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
          {t('heading')}
        </h2>
        <p className="mt-5 text-base leading-relaxed text-foreground-muted md:text-lg">
          {t('subtext')}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {PAYMENT_LABELS.map((label) => (
            <span
              key={label}
              className="rounded-full border border-border-subtle bg-surface-subtle px-3 py-1 text-xs font-medium text-foreground-muted"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
