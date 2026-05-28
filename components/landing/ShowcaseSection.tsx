import { getTranslations } from 'next-intl/server'
import { ShowcaseCard, type ShowcaseTheme } from './ShowcaseCard'
import type { FontPresetForRender } from '@/components/event/EventTitle'

// ─── Synthetic event data ────────────────────────────────────────────────
// All four entries are gradient-type themes from the seed catalog — pure
// CSS values, no image fetch. The earlier mix (Cotton Candy + three
// Unsplash themes) was broken in production because the seed's Unsplash
// URLs use a bare photo-<id> form that doesn't resolve on Unsplash's CDN
// (real URLs need a hash-suffixed path), giving the showcase three
// broken-image icons. Sidestepping the issue entirely with gradient-only
// picks. Verified against supabase/migrations/20260507211248_seed_catalog.sql.

const COTTON_CANDY: ShowcaseTheme = {
  background_type: 'gradient',
  background_value: {
    type: 'gradient',
    css: 'linear-gradient(135deg, #ffd1ec 0%, #c9b6ff 50%, #a0e4ff 100%)',
  },
}

const LAVENDER_MIST: ShowcaseTheme = {
  background_type: 'gradient',
  background_value: {
    type: 'gradient',
    css: 'linear-gradient(135deg, #f5f0ff 0%, #d6c8f2 60%, #a890e0 100%)',
  },
}

const COSMIC: ShowcaseTheme = {
  background_type: 'gradient',
  background_value: {
    type: 'gradient',
    css: 'conic-gradient(from 220deg at 50% 50%, #4c1d95, #db2777, #f59e0b, #4c1d95)',
  },
}

const PEACH_CREAM: ShowcaseTheme = {
  background_type: 'gradient',
  background_value: {
    type: 'gradient',
    css: 'linear-gradient(160deg, #ffe8d6 0%, #ffc09f 50%, #ff8c69 100%)',
  },
}

// Font presets — shape matches font_presets table rows. Values mirror the
// approved [ui-6a] catalog entries so the rendered title weights/letter-
// spacing match what a user gets in the real editor.
const PACIFICO: FontPresetForRender = {
  font_family: 'Pacifico',
  font_weight: 400,
  letter_spacing: 'normal',
  text_transform: 'none',
}
const PLAYFAIR: FontPresetForRender = {
  font_family: 'Playfair Display',
  font_weight: 600,
  letter_spacing: '-0.01em',
  text_transform: 'none',
}
const YESEVA: FontPresetForRender = {
  font_family: 'Yeseva One',
  font_weight: 400,
  letter_spacing: '0',
  text_transform: 'none',
}
const CORMORANT: FontPresetForRender = {
  font_family: 'Cormorant Garamond',
  font_weight: 500,
  letter_spacing: '0.01em',
  text_transform: 'none',
}

// Plausible near-future event timestamp at 7 PM Baku local-ish time. Server
// Component renders at request time so each visitor sees fresh "soon" dates
// — no stale "April 2026" lingering in a cached static build.
function eventDate(daysAhead: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  d.setHours(19, 0, 0, 0)
  return d
}

export async function ShowcaseSection() {
  const t = await getTranslations('landing.showcase')

  return (
    <section className="px-4 pt-24 pb-24 md:px-6 md:pt-32 md:pb-32">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            {t('heading')}
          </h2>
          <p className="mt-4 text-base text-foreground-muted md:text-lg">
            {t('subtext')}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
          <ShowcaseCard
            theme={COTTON_CANDY}
            fontPreset={PACIFICO}
            textColor="#1a1a2e"
            title="Aysel'in doğum günü"
            date={eventDate(14)}
            dateLocale="az"
          />
          <ShowcaseCard
            theme={LAVENDER_MIST}
            fontPreset={PLAYFAIR}
            textColor="#2c1f4a"
            title="Saturday Supper Club"
            date={eventDate(21)}
            dateLocale="en"
          />
          <ShowcaseCard
            theme={COSMIC}
            fontPreset={YESEVA}
            textColor="#ffffff"
            title="Концерт под звёздами"
            date={eventDate(28)}
            dateLocale="ru"
          />
          <ShowcaseCard
            theme={PEACH_CREAM}
            fontPreset={CORMORANT}
            textColor="#3d1f10"
            title="Toy mərasimi"
            date={eventDate(35)}
            dateLocale="az"
          />
        </div>
      </div>
    </section>
  )
}
