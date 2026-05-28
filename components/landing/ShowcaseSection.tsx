import { getTranslations } from 'next-intl/server'
import { ShowcaseCard, type ShowcaseTheme } from './ShowcaseCard'
import type { FontPresetForRender } from '@/components/event/EventTitle'

// ─── Synthetic event data ────────────────────────────────────────────────
// All four entries are hand-composed objects matching the production
// data shapes (theme.background_value follows the seed catalog JSON,
// fontPreset follows the font_presets row shape). NOT a DB fetch — landing
// renders deterministically at request time without hitting Supabase.
//
// Theme values copied verbatim from supabase/migrations/20260507211248_seed_catalog.sql
// so any future tweak to a catalog row needs a mirror edit here. Acceptable
// for v1 — these are static showcase samples, not live data.

const COTTON_CANDY: ShowcaseTheme = {
  background_type: 'gradient',
  background_value: {
    type: 'gradient',
    css: 'linear-gradient(135deg, #ffd1ec 0%, #c9b6ff 50%, #a0e4ff 100%)',
  },
}

const MONO_BOUQUET: ShowcaseTheme = {
  background_type: 'unsplash',
  background_value: {
    type: 'unsplash',
    photo_id: '1MZl_G6lWhQ',
    url: 'https://images.unsplash.com/photo-1MZl_G6lWhQ?w=1600&q=80',
    overlay_css:
      'linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.15))',
  },
}

const NEON_LIGHT: ShowcaseTheme = {
  background_type: 'unsplash',
  background_value: {
    type: 'unsplash',
    photo_id: 'LeG68PrXA6Y',
    url: 'https://images.unsplash.com/photo-LeG68PrXA6Y?w=1600&q=80',
    overlay_css:
      'linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.15))',
  },
}

const SANDSTONE: ShowcaseTheme = {
  background_type: 'unsplash',
  background_value: {
    type: 'unsplash',
    photo_id: 'gREi-9tI5Mg',
    url: 'https://images.unsplash.com/photo-gREi-9tI5Mg?w=1600&q=80',
    overlay_css:
      'linear-gradient(rgba(255,255,255,0.25), rgba(255,255,255,0.05))',
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
            theme={MONO_BOUQUET}
            fontPreset={PLAYFAIR}
            textColor="#ffffff"
            title="Saturday Supper Club"
            date={eventDate(21)}
            dateLocale="en"
          />
          <ShowcaseCard
            theme={NEON_LIGHT}
            fontPreset={YESEVA}
            textColor="#ffffff"
            title="Концерт под звёздами"
            date={eventDate(28)}
            dateLocale="ru"
          />
          <ShowcaseCard
            theme={SANDSTONE}
            fontPreset={CORMORANT}
            textColor="#1a1a1a"
            title="Toy mərasimi"
            date={eventDate(35)}
            dateLocale="az"
          />
        </div>
      </div>
    </section>
  )
}
