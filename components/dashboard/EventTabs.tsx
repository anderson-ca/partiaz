'use client'

import Link from 'next/link'
import { CalendarPlus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Pill } from '@/components/ui/pill'
import { cn } from '@/lib/utils'

type Counts = {
  upcoming: number
  hosting: number
  past: number
}

type EventTabsProps = {
  /** Counts and pre-rendered card grids. Server pre-renders the EventCards
   *  (which are async Server Components) and passes the resulting ReactNodes
   *  in as `*Cards` props. The grid + tile chrome lives here in the Client
   *  Component so tab state can stay client-side. */
  counts: Counts
  upcomingCards: React.ReactNode | null
  hostingCards: React.ReactNode | null
  newEventTile: React.ReactNode
  locale: string
}

const GRID_CLASS =
  'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'

export function EventTabs({
  counts,
  upcomingCards,
  hostingCards,
  newEventTile,
  locale,
}: EventTabsProps) {
  const t = useTranslations('dashboard')

  return (
    <Tabs defaultValue="hosting" className="w-full">
      <TabsList className="mb-6 inline-flex h-auto gap-2 rounded-full bg-white/5 p-1 backdrop-blur-sm">
        <TabPillTrigger value="upcoming" label={t('tabUpcoming')} count={counts.upcoming} />
        <TabPillTrigger value="hosting" label={t('tabHosting')} count={counts.hosting} />
        <TabPillTrigger value="past" label={t('tabPast')} count={counts.past} />
      </TabsList>

      <TabsContent value="upcoming">
        {counts.upcoming === 0 ? (
          <EmptyEventsState locale={locale} />
        ) : (
          <div className={GRID_CLASS}>
            {upcomingCards}
            {newEventTile}
          </div>
        )}
      </TabsContent>

      <TabsContent value="hosting">
        {counts.hosting === 0 ? (
          <EmptyEventsState locale={locale} />
        ) : (
          <div className={GRID_CLASS}>
            {hostingCards}
            {newEventTile}
          </div>
        )}
      </TabsContent>

      <TabsContent value="past">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-6 py-16 text-center backdrop-blur-sm">
          <p className="max-w-sm text-sm text-white/60">
            {t('pastComingSoon')}
          </p>
        </div>
      </TabsContent>
    </Tabs>
  )
}

function TabPillTrigger({
  value,
  label,
  count,
}: {
  value: string
  label: string
  count: number
}) {
  return (
    <TabsTrigger
      value={value}
      className={cn(
        // Quiet, translucent pill aesthetic — matches the rest of the app's
        // button language. Override shadcn's default underline-style trigger.
        'gap-2 rounded-full border-0 px-4 py-2 text-sm font-medium text-white/60 transition-all duration-150',
        'hover:bg-white/5 hover:text-white',
        'data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40',
      )}
    >
      <span>{label}</span>
      <Pill
        variant="muted"
        className="px-1.5 py-0.5 text-[10px] leading-none"
      >
        {count}
      </Pill>
    </TabsTrigger>
  )
}

function EmptyEventsState({ locale }: { locale: string }) {
  const t = useTranslations('dashboard')
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/5 bg-white/5 px-6 py-16 text-center backdrop-blur-sm">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white">
        <CalendarPlus className="h-6 w-6" />
      </span>
      <h3 className="text-lg font-semibold text-white">{t('emptyTitle')}</h3>
      <Button asChild size="lg">
        <Link href={`/${locale}/events/new`}>{t('emptyCta')}</Link>
      </Button>
    </div>
  )
}
