import { Globe, Mail, Sparkles } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

const CARDS = [
  { id: 'themes', Icon: Sparkles },
  { id: 'rsvps', Icon: Mail },
  { id: 'languages', Icon: Globe },
] as const

export async function ValuePropSection() {
  const t = await getTranslations('landing.valueProps')

  return (
    <section className="px-4 pt-12 pb-24 md:px-6 md:pt-16 md:pb-32">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            {t('heading')}
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          {CARDS.map(({ id, Icon }) => (
            <div
              key={id}
              className="rounded-2xl border border-border-faint bg-surface-subtle p-8 backdrop-blur-md"
            >
              <Icon className="h-5 w-5 text-brand-300" />
              <h3 className="mt-5 text-lg font-semibold text-white">
                {t(`cards.${id}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                {t(`cards.${id}.body`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
