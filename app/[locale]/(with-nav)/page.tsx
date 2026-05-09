import Link from 'next/link'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { routing } from '@/i18n/routing'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('common')

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-6 px-4 py-12 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">parti.az</h1>
      <p className="text-lg text-muted-foreground">{t('hello')}</p>
      <nav className="flex gap-2" aria-label="Locale switcher">
        {routing.locales.map((l) => (
          <Button
            key={l}
            asChild
            variant={l === locale ? 'default' : 'outline'}
            size="sm"
          >
            <Link href={`/${l}`}>{l.toUpperCase()}</Link>
          </Button>
        ))}
      </nav>
      <Button asChild>
        <Link href={`/${locale}/login`}>{t('logIn')}</Link>
      </Button>
    </main>
  )
}
