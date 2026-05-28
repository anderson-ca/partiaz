import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'

export async function FinalCtaSection({ locale }: { locale: string }) {
  const t = await getTranslations('landing.cta')
  const signupHref = `/${locale}/login?next=${encodeURIComponent(`/${locale}/events/new`)}`

  return (
    <section className="px-4 pt-16 pb-24 md:px-6 md:pt-24 md:pb-32">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
          {t('heading')}
        </h2>
        <p className="mt-5 text-base text-foreground-muted md:text-lg">
          {t('subtext')}
        </p>
        <div className="mt-10 flex justify-center">
          <Button
            asChild
            size="lg"
            className="bg-brand-500 px-6 hover:bg-brand-600"
          >
            <Link href={signupHref}>{t('button')}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
