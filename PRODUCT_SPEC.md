# parti.az — Product Specification

**Version:** 1.0 (pre-build)
**Last updated:** May 7, 2026
**Status:** Source of truth for v1. Update this file as scope evolves.

---

## 1. Product overview

**parti.az** is a Partiful-style event invitation and RSVP web app, localized for Baku, Azerbaijan.

### The thesis

Do one thing perfectly: coordinate a party. Beautiful event pages, frictionless RSVPs (no account needed for guests), distribution via WhatsApp share links — because that's how people actually communicate in this market.

### Target user

Urban Gen Z and millennial Bakuvians hosting birthdays, dinners, game nights, work events, and small gatherings. Multilingual crowd — Az/Ru/En depending on context.

### Differentiators from Partiful

- **WhatsApp-first distribution** instead of SMS
- **Multilingual from day one** (Az / Ru / En)
- **Local payment context** — no Venmo/CashApp; free-form chip-in field where the host pastes IBAN, m10, Birbank QR, etc.
- **No US-centric assumptions** in date formats, currency, addresses

### What we're explicitly NOT doing in v1

- Native iOS/Android apps (mobile web is enough; PWA is a possible later step)
- WhatsApp Cloud API (programmatic sending) — `wa.me` share links cover v1
- In-app payments (Stripe, etc.)
- Public discovery / Explore feed
- Push notifications
- Mutuals / social graph
- "Send a card" feature (separate product surface in Partiful — out of scope)

---

## 2. Scope

### P0 — must ship in v1

**Auth & accounts**
- Host login: email magic link + Google OAuth
- Guest RSVPs without account creation (tokenized invite links)

**Event creation**
- Title, description, theme, effect, font preset, text color
- Date/time with TBD support
- Location (text + URL)
- Cover image (from library or uploaded)
- Capacity (optional, infinite by default)
- Plus-ones (off / up to N)
- Cost per person (informational)
- Chip-in (free-text field — IBAN/m10/etc.)

**Custom sections** (the `+ Link / + Playlist / + Registry / + Dress code / + New section` UI)
- Pre-built quick types: Link, Playlist, Registry, Dress code
- Generic custom field with icon picker (link, info, music, gift, shirt, fork+knife, car, bed, phone, sparkles)
- Each section has icon + label + URL or text content
- Reorderable

**Event page**
- Public, themed, mobile-first
- Renders theme background + effect overlay + custom font
- Shows host(s), date/time, location (with privacy lock), description
- Custom sections rendered with icons
- RSVP buttons (configurable style: emojis / words / minimal)
- Guest list (optional display)
- Calendar export (.ics)

**RSVP system**
- Yes / No / Maybe (Maybe is toggleable per event)
- Plus-ones (up to N configured)
- Custom questionnaire support
- Frictionless: name + (optional) phone/email, no account
- RSVP confirmation email

**Date polling**
- Host proposes multiple date options
- Guests vote (multi-select — guests can vote for any number of options they're available for)
- Host picks final → all RSVPs auto-update to that date

**Questionnaire**
- Free text, single-choice, multi-choice, yes/no
- Each question marked required or optional
- Host views answers in the dashboard

**Photo album**
- Guests upload after event (no account required)
- Gallery view on the event page
- Host can moderate (delete photos)

**Email notifications**
- RSVP confirmation to guest
- New RSVP notification to host
- Event reminders (1 week before to invited/maybe; 2 hours before to going)
- Edit/cancel notifications to all guests

**WhatsApp distribution**
- "Share via WhatsApp" — opens host's WhatsApp with event link pre-filled
- "Share to specific guest" — opens chat with that guest's number, link pre-filled
- Web Share API fallback for "share to anywhere"

**Privacy controls** (Display & Privacy in event settings)
- Show / hide guest names
- Show / hide guest count
- Show / hide activity timestamps
- Optional event password (passphrase before viewing)
- Public vs Private toggle (Private = link-only; Public = listed on the host's profile, but no Explore feed in v1)

**RSVP options** (RSVPs tab in event settings)
- Accept RSVPs (master toggle)
- Plus-ones (None / Up to 1 / Up to 2 / Up to 3)
- Require names
- Max capacity
- RSVP button style (Emojis / Words / Minimal)
- Allow "Maybe" RSVP

**Settings: Audience**
- Private (link only)
- Public (visible on host's profile page)

**Settings: Auto-Reminders**
- Enable/disable master toggle
- Reminder schedule presets (1 week before, 2 hours before)
- Sent via email in v1 (NOT SMS — we removed SMS)

**Settings: Chip in**
- Free-text field with disclaimer: "Payments are not verified. Guests self-report payment during RSVP."

**Theme system**
- Theme picker with categories: All, Dark, Trending, Fun, Light, Seasonal
- Custom color picker (eyedropper / hex input)
- Random/shuffle dice button
- Theme types: gradient (CSS), photo (Unsplash), pattern (SVG), solid color

**Effect system**
- Effect picker with categories: All, Fun, Classic, Trending, Seasonal
- Random/shuffle dice button
- "None" option
- ~12-15 starter effects (confetti, snow, hearts, stars, fireworks, bubbles, sparkles, emoji rain, petals, rain, embers, balloons, etc.)

**Typography system**
- Font category picker: Classic, Eclectic, Fancy, Literary, Digital, Elegant
- ~8-10 fonts mapped to categories (verified for Az + Ru + En glyph coverage)
- Text color picker (independent of theme; defaults to theme's recommended color)
- Optional text effect (none / glow / outline / gradient / 3D / animated gradient)

**Cover image picker**
- Searchable library with category tabs: Trending, Birthday, Elegant, Minimal, Dinner Party, Themed, Holiday, Chill
- Tabs: Posters / GIFs
- Upload custom image
- Library backed by Unsplash API (curated queries) + a small set of static "official" posters we ship

**Host dashboard**
- List of events (drafts + published + past)
- Each event card: cover thumbnail, title, date, RSVP counts
- "+ New event" CTA
- Profile menu: profile, switch profile, settings, log out

**i18n**
- Az (default), Ru, En
- Locale routing: `/[locale]/...`
- Footer locale switcher
- All UI strings translated; user-generated content stored as-is

**Mobile-first**
- Primary viewport: 360–414px
- Desktop = enhanced layout with side-by-side preview (like the Partiful screenshots)

---

### P1 — defer to v1.5

- Cohosts (multiple users with edit access)
- "Add cohost via link" (shareable cohost invite)
- "Allow guests to invite mutuals" (viral guest-to-guest invites)
- "Require guest approval" / waitlist flow ("Get on the list")
- Activity timestamps display granularity controls
- Host profile pages with all their public events
- Theme/effect random shuffle button
- Comments + emoji/GIF reactions on event page
- "Crushes" feature (guests can secret-message other guests)
- Re-invite past guests from a previous event

### Out of scope for v1 (no plans to build soon)

- Public discovery / Explore feed
- Native iOS/Android apps
- WhatsApp Cloud API (programmatic templates, broadcast)
- In-app payments
- "Send a card" (separate product surface)
- Mutuals (social graph)

---

## 3. Tech stack

| Layer            | Choice                                              | Why                                                     |
| ---------------- | --------------------------------------------------- | ------------------------------------------------------- |
| Framework        | Next.js 15 (App Router)                             | Server Components, Server Actions, edge-ready           |
| Language         | TypeScript strict                                   | Catches errors before they ship                         |
| Styling          | Tailwind CSS v4                                     | Mobile-first by default, fast iteration                 |
| UI primitives    | shadcn/ui (new-york style, neutral base)            | Owned components, easy to re-skin                       |
| Icons            | lucide-react                                        | Standard with shadcn                                    |
| Animation        | framer-motion                                       | Page transitions, letter reveals, micro-interactions    |
| Particles (ambient) | @tsparticles/react                               | Continuous background effects (the Effect system)       |
| Particles (one-shot) | partycles (`useReward` hook)                    | Reward animations on RSVP / publish (optional polish)   |
| Color picker     | react-colorful                                      | Tiny, modern, perfect for our needs                     |
| Text splitter    | splittypejs                                         | Letter-by-letter animations for text effects            |
| Backend / DB     | Supabase (Postgres, Auth, Storage, Realtime)        | Removes ~60% of backend work for solo dev               |
| Forms            | react-hook-form + zod                               | Standard, type-safe                                     |
| Validation       | zod                                                 | Single source of truth, client + server                 |
| Dates            | date-fns + date-fns-tz                              | Asia/Baku is UTC+4, no DST                              |
| i18n             | next-intl                                           | Best App Router support                                 |
| Email            | Resend + React Email                                | Cheap, simple, React-based templates                    |
| Image storage    | Supabase Storage + next/image                       | Built-in CDN + transformations                          |
| Image library    | Unsplash API (curated)                              | Free with attribution                                   |
| Hosting          | Vercel                                              | Path of least friction with Next.js                     |
| Cron             | Vercel Cron                                         | Triggers reminder emails                                |
| Monitoring       | Sentry (added in late phase)                        | Catch prod errors                                       |
| Analytics        | Vercel Analytics + PostHog (optional, v1.5)         | Vercel free; PostHog for funnels                        |
| Package manager  | pnpm                                                | Faster, simpler than yarn                               |
| Node             | 22.x LTS                                            |                                                         |

### Versions to verify at scaffolding time

Before installing, run `web_search` for the latest stable versions of: Next.js 15.x, React 19.x, Tailwind v4, next-intl (App Router config has changed across versions), Supabase JS, shadcn/ui CLI, Resend.

---

## 4. Third-party services

Set up these accounts before starting:

| Service                    | Free tier? | Notes                                                                       |
| -------------------------- | ---------- | --------------------------------------------------------------------------- |
| **Supabase**               | Yes        | One project. Save URL, anon key, service_role key.                          |
| **Resend**                 | Yes (3k/mo)| Verify a sending domain (mail.parti.az) for deliverability.                 |
| **Google Cloud Console**   | Yes        | OAuth client for Google sign-in. Redirect: `https://<project>.supabase.co/auth/v1/callback` |
| **Unsplash Developer**     | Yes        | API key for cover image library. Demo: 50 req/h, full: 5000 req/h after approval. |
| **Vercel**                 | Yes        | Link GitHub repo when ready.                                                |
| **Domain (parti.az)**      | ~$20/yr    | Buy from any AZ registrar, point to Vercel.                                 |
| **Sentry** (later)         | Yes        | Add in late phase.                                                          |

All keys live in `.env.local` (never committed) and are referenced from `.env.example` (committed, no values).

### Required environment variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

# Resend
RESEND_API_KEY=
EMAIL_FROM_ADDRESS=

# Google OAuth (configured in Supabase, not needed here directly)

# Unsplash
UNSPLASH_ACCESS_KEY=

# Site
NEXT_PUBLIC_SITE_URL=https://parti.az

# Cron
CRON_SECRET=  # random string for protecting cron endpoints
```

---

## 5. Data model

Postgres schema. All tables have `id uuid` PK (default `gen_random_uuid()`) and `created_at timestamptz default now()` unless noted.

### 5.1 Tables

**`profiles`** — extends `auth.users`
| Column            | Type           | Notes                                |
| ----------------- | -------------- | ------------------------------------ |
| id                | uuid (PK, FK)  | references `auth.users.id`           |
| display_name      | text           |                                      |
| avatar_url        | text           |                                      |
| locale            | text           | 'az' | 'ru' | 'en'                   |
| phone             | text           | optional                             |

**`events`**
| Column            | Type           | Notes                                |
| ----------------- | -------------- | ------------------------------------ |
| id                | uuid (PK)      |                                      |
| slug              | text unique    | 6–8 char base62, e.g. `qbk5x9`       |
| host_id           | uuid (FK)      | profiles.id                          |
| title             | text           |                                      |
| description       | text           |                                      |
| theme_id          | uuid (FK)      | themes.id                            |
| theme_color_override | text         | nullable; if set, overrides theme bg |
| effect_id         | uuid (FK)      | nullable; effects.id                 |
| font_preset_id    | uuid (FK)      | font_presets.id                      |
| text_color        | text           | hex                                  |
| text_effect       | text           | 'none' | 'glow' | 'outline' | ...    |
| cover_image_url   | text           | nullable                             |
| cover_image_source| text           | 'library' | 'unsplash' | 'upload'    |
| starts_at         | timestamptz    | nullable if `is_tbd`                 |
| ends_at           | timestamptz    | nullable                             |
| is_tbd            | bool           | default false                        |
| timezone          | text           | default 'Asia/Baku'                  |
| location_text     | text           | nullable                             |
| location_url      | text           | nullable                             |
| location_hidden_until_rsvp | bool  | default true                         |
| capacity          | int            | nullable                             |
| plus_ones         | int            | 0 = none, 1 = up to 1, etc.          |
| allow_maybe       | bool           | default true                         |
| require_names     | bool           | default true                         |
| rsvp_button_style | text           | 'emojis' | 'words' | 'minimal'        |
| cost_per_person_text | text         | nullable; informational only         |
| chip_in_text      | text           | nullable; free-form                  |
| event_password    | text           | nullable; bcrypt-hashed              |
| audience          | text           | 'private' | 'public_profile'         |
| show_guest_names  | bool           | default true                         |
| show_guest_count  | bool           | default true                         |
| show_timestamps   | bool           | default true                         |
| reminders_enabled | bool           | default true                         |
| status            | text           | 'draft' | 'published' | 'canceled'   |
| updated_at        | timestamptz    |                                      |

**`event_sections`** — custom sections (Link, Playlist, Registry, Dress code, custom)
| Column          | Type        | Notes                                                        |
| --------------- | ----------- | ------------------------------------------------------------ |
| id              | uuid (PK)   |                                                              |
| event_id        | uuid (FK)   |                                                              |
| kind            | text        | 'link' | 'playlist' | 'registry' | 'dress_code' | 'custom' |
| icon            | text        | 'link' | 'info' | 'music' | 'gift' | 'shirt' | 'utensils' | 'car' | 'bed' | 'phone' | 'sparkles' |
| label           | text        |                                                              |
| value_url       | text        | nullable                                                     |
| value_text      | text        | nullable                                                     |
| order_index     | int         |                                                              |

**`event_cohosts`** *(P1, schema reserved)*
| Column          | Type        |
| --------------- | ----------- |
| event_id        | uuid (FK)   |
| user_id         | uuid (FK)   |
| PRIMARY KEY     | (event_id, user_id) |

**`guests`**
| Column            | Type           | Notes                                                |
| ----------------- | -------------- | ---------------------------------------------------- |
| id                | uuid (PK)      |                                                      |
| event_id          | uuid (FK)      |                                                      |
| name              | text           |                                                      |
| phone             | text           | nullable; for host's WhatsApp share                  |
| email             | text           | nullable; for confirmation/reminders                 |
| rsvp              | text           | 'pending' | 'yes' | 'no' | 'maybe'                  |
| plus_one_count    | int            | default 0                                            |
| invite_token      | text unique    | random 24-char URL-safe                              |
| claimed_user_id   | uuid (FK)      | nullable                                             |
| invited_at        | timestamptz    | nullable                                             |
| responded_at      | timestamptz    | nullable                                             |
| host_notes        | text           | nullable; private to host                            |

**`questions`**
| Column          | Type        | Notes                                |
| --------------- | ----------- | ------------------------------------ |
| id              | uuid (PK)   |                                      |
| event_id        | uuid (FK)   |                                      |
| label           | text        |                                      |
| type            | text        | 'text' | 'single' | 'multi' | 'yes_no' |
| options         | jsonb       | array of strings (single/multi only) |
| required        | bool        |                                      |
| order_index     | int         |                                      |

**`answers`**
| Column          | Type        |
| --------------- | ----------- |
| id              | uuid (PK)   |
| question_id     | uuid (FK)   |
| guest_id        | uuid (FK)   |
| value           | jsonb       |
| UNIQUE          | (question_id, guest_id) |

**`date_polls`**
| Column          | Type        |
| --------------- | ----------- |
| id              | uuid (PK)   |
| event_id        | uuid (FK)   |
| status          | text        | 'open' | 'closed' |
| closed_at       | timestamptz | nullable |

**`date_options`**
| Column          | Type        |
| --------------- | ----------- |
| id              | uuid (PK)   |
| poll_id         | uuid (FK)   |
| starts_at       | timestamptz |
| ends_at         | timestamptz |

**`date_votes`**
| Column          | Type        |
| --------------- | ----------- |
| id              | uuid (PK)   |
| option_id       | uuid (FK)   |
| guest_id        | uuid (FK)   |
| UNIQUE          | (option_id, guest_id) |

**`photos`**
| Column            | Type        | Notes                          |
| ----------------- | ----------- | ------------------------------ |
| id                | uuid (PK)   |                                |
| event_id          | uuid (FK)   |                                |
| uploader_guest_id | uuid (FK)   | nullable                       |
| uploader_user_id  | uuid (FK)   | nullable                       |
| storage_path      | text        | path in Supabase Storage       |
| thumbnail_path    | text        | nullable                       |
| width             | int         |                                |
| height            | int         |                                |

**`themes`**
| Column            | Type        | Notes                                                  |
| ----------------- | ----------- | ------------------------------------------------------ |
| id                | uuid (PK)   |                                                        |
| name              | text        |                                                        |
| category          | text        | 'dark' | 'light' | 'trending' | 'fun' | 'seasonal'    |
| background_type   | text        | 'gradient' | 'unsplash' | 'pattern' | 'solid'         |
| background_value  | jsonb       | shape varies by type (see §8)                          |
| recommended_text_color | text   | hex                                                    |
| order_index       | int         |                                                        |

**`effects`**
| Column            | Type        | Notes                                                  |
| ----------------- | ----------- | ------------------------------------------------------ |
| id                | uuid (PK)   |                                                        |
| name              | text        |                                                        |
| category          | text        | 'fun' | 'classic' | 'trending' | 'seasonal'           |
| engine            | text        | 'tsparticles' | 'css'                                  |
| config            | jsonb       | engine-specific config                                 |
| order_index       | int         |                                                        |

**`font_presets`**
| Column            | Type        | Notes                                                  |
| ----------------- | ----------- | ------------------------------------------------------ |
| id                | uuid (PK)   |                                                        |
| category          | text        | 'classic' | 'eclectic' | 'fancy' | 'literary' | 'digital' | 'elegant' |
| name              | text        |                                                        |
| font_family       | text        | matches Google Fonts name                              |
| font_weight       | int         |                                                        |
| letter_spacing    | text        | e.g. '-0.02em'                                         |
| text_transform    | text        | 'none' | 'uppercase' | 'capitalize'                  |
| supports_az       | bool        | verified glyph coverage for Azerbaijani                |
| supports_ru       | bool        | verified glyph coverage for Russian                    |

**`event_messages`** — host text blasts (in v1: email-only since we skipped SMS)
| Column          | Type        | Notes                                |
| --------------- | ----------- | ------------------------------------ |
| id              | uuid (PK)   |                                      |
| event_id        | uuid (FK)   |                                      |
| sender_user_id  | uuid (FK)   |                                      |
| body            | text        |                                      |
| audience_filter | text        | 'all' | 'going' | 'maybe' | 'invited' |
| sent_at         | timestamptz |                                      |

### 5.2 Row-Level Security (RLS)

**Enable RLS on every table.** Sketch of policies — full SQL goes into the migration files.

| Table              | Read                                                      | Write                                                                           |
| ------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `profiles`         | self only                                                 | self only                                                                       |
| `events`           | host; OR anyone if `status='published'`                   | host only                                                                       |
| `event_sections`   | follows event                                             | host only                                                                       |
| `guests`           | host; OR matching `invite_token` param                    | host CRUD; anonymous can update only their own row by `invite_token`            |
| `questions`        | follows event                                             | host only                                                                       |
| `answers`          | host; OR matching `invite_token` of related guest         | guest with valid `invite_token`                                                 |
| `date_polls`       | follows event                                             | host only                                                                       |
| `date_options`     | follows event                                             | host only                                                                       |
| `date_votes`       | host; OR matching `invite_token`                          | guest with valid `invite_token`                                                 |
| `photos`           | follows event                                             | anyone with valid event_id (rate-limited); host can delete                      |
| `themes`           | public read                                               | service_role only                                                               |
| `effects`          | public read                                               | service_role only                                                               |
| `font_presets`     | public read                                               | service_role only                                                               |
| `event_messages`   | host only                                                 | host only                                                                       |

**Defense in depth:** every Server Action validates ownership/tokens before mutating. Don't rely on RLS alone.

---

## 6. Auth model

### 6.1 Hosts

- Sign in via **Supabase Auth**
- Two methods: **email magic link** + **Google OAuth**
- Session = Supabase auth cookie, read in middleware and Server Actions
- On first sign-in, a `profiles` row is auto-inserted via Supabase trigger
- Sign-in flow: `/[locale]/login` → submit email or click Google → callback → redirect to `/[locale]/events`

### 6.2 Guests

- **No account required.** Identity = `invite_token` in URL.
- **Public event URL:** `/[locale]/e/[slug]` — anyone can RSVP, but identity is fresh
- **Personal invite URL:** `/[locale]/e/[slug]?g=[invite_token]` — pre-fills name/contact, lets them update their RSVP
- If a guest RSVPs from `/e/[slug]` (no token), we create a new `guests` row, issue a new token, and persist it in a cookie + redirect to the personalized URL
- Optional future: a guest can "claim" their RSVPs by signing up with the same email/phone — sets `claimed_user_id`

### 6.3 Anti-abuse (basic, v1)

- Server Actions check that incoming `invite_token` is valid for the event
- Photo uploads rate-limited via Supabase Storage policy
- More sophisticated rate limiting (Upstash Redis) deferred to v1.5

---

## 7. WhatsApp distribution (the share story)

### 7.1 wa.me share links

The host doesn't have a business WhatsApp number. The app generates URLs that open the host's own WhatsApp with a pre-filled message containing the event link.

```ts
// lib/whatsapp.ts
export function buildWhatsAppShareUrl(opts: {
  message: string;
  phone?: string;
}) {
  const text = encodeURIComponent(opts.message);
  return opts.phone
    ? `https://wa.me/${opts.phone.replace(/\D/g, '')}?text=${text}`
    : `https://wa.me/?text=${text}`;
}
```

### 7.2 Web Share API as universal fallback

```ts
// On mobile, prefer Web Share API — surfaces ALL the user's apps
if (navigator.share) {
  await navigator.share({ title, text, url });
} else {
  window.open(buildWhatsAppShareUrl({ message: `${text} ${url}` }));
}
```

### 7.3 Share UI

In the host dashboard for an event:

- **"Share event"** button (top-level)
  - On mobile: Web Share API → all apps
  - On desktop: opens a sheet with options (Copy link, WhatsApp, Email, Telegram)

- **Per-guest "Send invite"** button (in guest list)
  - Generates personalized URL with `?g=<invite_token>`
  - Opens WhatsApp chat with that guest's number (if known) and pre-fills the message
  - If no phone: opens generic share sheet with the personalized link

### 7.4 Default share message templates (per locale)

```
Az: "{host} sizi {event_title} tədbirinə dəvət edir 🎉 Cavabınızı bildirin: {url}"
Ru: "{host} приглашает тебя на {event_title} 🎉 Подтверди участие: {url}"
En: "{host} is inviting you to {event_title} 🎉 RSVP here: {url}"
```

---

## 8. Theme system

### 8.1 Two-axis model

Theme (background) and Effect (animation overlay) are **independent**. Any theme can be combined with any effect.

```
<EventPageBackground theme={event.theme} colorOverride={event.theme_color_override} />
<EventPageEffect effect={event.effect} />
<EventPageContent>
  <EventTitle font={event.font_preset} effect={event.text_effect} color={event.text_color} />
  ...
</EventPageContent>
```

Three layers, fully composable.

### 8.2 Theme types and `background_value` shape

**`gradient`**
```json
{ "type": "gradient", "css": "radial-gradient(at 30% 20%, #ff6b9d, #5b8def)" }
```

**`unsplash`**
```json
{ "type": "unsplash", "photo_id": "abc123", "url": "https://images.unsplash.com/...", "overlay_css": "linear-gradient(rgba(0,0,0,0.3),transparent)" }
```

**`pattern`** (SVG pattern from a free pattern library or hand-authored)
```json
{ "type": "pattern", "svg_url": "/patterns/dots.svg", "background_color": "#fafafa", "scale": 1.0 }
```

**`solid`**
```json
{ "type": "solid", "color": "#1a1a2e" }
```

### 8.3 Theme catalog for v1 launch

Curate **30+ themes** seeded into the `themes` table. Suggested distribution:
- 12 gradients (mix of warm, cool, mesh, conic, radial)
- 10 Unsplash photos (clouds, water, smoke, marble, neon, sunset, pastel sky, abstract)
- 6 SVG patterns (dots, lines, waves, floral, geometric, noise)
- 2 solid colors (deep purple, off-white)
- Plus: a "custom color" picker option that creates an ad-hoc gradient

### 8.4 Asset sources (free)

- **Unsplash API** — `https://api.unsplash.com/search/photos` with curated queries; cache photo IDs
- **uiGradients / Mesh.cssgradient.io** — gradient configs to copy-paste
- **Hero Patterns / SVGBackgrounds.com** — free SVG patterns
- **Custom color** — `react-colorful` for picker UI

### 8.5 UI

- Sidebar rail on event editor: Theme button → opens picker panel
- Picker has filter tabs (All, Dark, Trending, Fun, Light, Seasonal)
- First slot: custom color (eyedropper icon)
- Grid of theme circles
- "Random" dice button: shuffles within current category

---

## 9. Effect system

### 9.1 Engine choice

- **`@tsparticles/react`** for continuous ambient effects (the page-background canvas always running)
- **`partycles`** (`useReward`) for one-shot bursts (RSVP confirmation, publish, etc. — optional polish layer)

### 9.2 Effect catalog for v1 launch

Curate **15 effects** seeded into `effects`. Each is a tsparticles config.

| Name        | Category   | Description                                  |
| ----------- | ---------- | -------------------------------------------- |
| None        | -          | Empty config; renders nothing                |
| Confetti    | fun        | Falling confetti; default for birthdays      |
| Snow        | seasonal   | Slow falling snowflakes                      |
| Hearts      | fun        | Floating hearts drifting upward              |
| Stars       | classic    | Gentle twinkling stars                       |
| Fireworks   | trending   | Looping firework bursts                      |
| Bubbles     | fun        | Drifting bubbles                             |
| Sparkles    | classic    | Soft sparkle glow                            |
| Emoji rain  | fun        | Configurable: host picks the emoji           |
| Petals      | seasonal   | Falling cherry blossom petals                |
| Rain        | -          | Moody rain drops                             |
| Embers      | seasonal   | Floating warm embers                         |
| Balloons    | fun        | Rising balloons                              |
| Lights      | classic    | String-light bokeh dots                      |
| Snow heavy  | seasonal   | Denser snowfall                              |

### 9.3 One-shot reward effects (partycles)

Wired into:
- Guest RSVPs "Going" → confetti burst from button
- Host taps "Publish" → sparkles
- First photo uploaded → hearts pop
- Date poll closed with a winner → fireworks burst

Optional. Can be cut entirely if it's blowing the budget — page still works without these.

### 9.4 Performance

- `@tsparticles/react` runs in a `<canvas>` overlay, `pointer-events: none`, fixed positioning
- On mobile, reduce particle count via media-query-driven config
- Respect `prefers-reduced-motion` — disable effects entirely

### 9.5 UI

- Sidebar rail on event editor: Effect button → picker panel
- Filter tabs (All, Fun, Classic, Trending, Seasonal)
- First slot: 🚫 None
- Grid of effect preview circles (each circle is a small animated preview)
- Random dice button

---

## 10. Typography system

### 10.1 Font categories and presets

Six categories, ~8-10 font presets total. Every font verified for **Az + Ru + En** glyph coverage before inclusion.

| Category | Suggested font(s) (verify Cyrillic + Latin Extended subsets) |
| -------- | ------------------------------------------------------------ |
| Classic  | Inter, IBM Plex Sans                                         |
| Eclectic | Caveat, Caveat Brush                                         |
| Fancy    | Italiana, Cinzel                                             |
| Literary | Cormorant Garamond, PT Serif                                 |
| Digital  | Space Mono, Major Mono Display                               |
| Elegant  | Playfair Display, Lora                                       |

**Pre-launch verification step:** for every font, manually confirm Az diacritics (`ə ç ş ğ ı ö ü`) and basic Cyrillic render correctly. Drop or replace any that fail.

### 10.2 Font loading

- **`next/font/google`** at the app layout level. All font presets preloaded so the picker can preview them.
- `font-display: swap`
- Subset to `latin`, `latin-ext`, `cyrillic`

### 10.3 Text color

- Independent of font category and theme
- **Default:** `theme.recommended_text_color`
- **Picker:** `react-colorful` hex picker
- For photo-backed themes: optional **scrim** (semi-transparent gradient under text) toggleable

### 10.4 Text effects (CSS-driven, no library)

Layer on top of the font preset. Each is a CSS class or SVG snippet.

| Effect          | Implementation                                                       |
| --------------- | -------------------------------------------------------------------- |
| `none`          | -                                                                    |
| `gradient`      | `background-clip: text; -webkit-text-fill-color: transparent`        |
| `outline`       | `-webkit-text-stroke`                                                |
| `glow`          | layered `text-shadow` with blur                                      |
| `extrude`       | stacked offset `text-shadow`                                         |
| `animated_gradient` | CSS `@keyframes` shifting `background-position`                  |
| `chromatic`     | Three layered text elements in offset RGB (decorative)               |
| `warp`          | SVG `<text>` inside `<filter>` with `feTurbulence + feDisplacementMap` |

For letter-by-letter reveals (entrance animation): `splittypejs` + framer-motion staggered children.

### 10.5 UI

- Font picker is a horizontal pill list directly under the event title input (matches Partiful's UX from the screenshot)
- Each pill renders the font's name in its own font (so user sees the look)
- Color picker accessed via a small swatch button next to the font pills
- Text effect dropdown (one of the 8 options above)

---

## 11. Cover image system

The big poster image on the event page.

### 11.1 Sources

1. **Library** — curated set we ship. Categories: Trending, Birthday, Elegant, Minimal, Dinner Party, Themed, Holiday, Chill, Not Chill, College
2. **Unsplash search** — host queries Unsplash directly from the picker
3. **GIFs tab** — Giphy API (search + categories)
4. **Upload** — host uploads their own image (stored in Supabase Storage)

### 11.2 Tabs and filters in the picker

Reproduces Partiful's UI from the cover image picker screenshot:
- Top: search input
- Filter pills: Trending / Birthday / Elegant / Minimal / Dinner Party / Themed / Community Made (skip in v1) / Chill / Not Chill / Holiday / College
- Bottom tabs: **Posters** / **GIFs**
- "Upload" button top-right

### 11.3 Storage

- Library posters: pre-uploaded to Supabase Storage, listed in a `cover_library` table or as a static JSON manifest
- Unsplash photos: store the photo URL + photo ID + attribution
- Uploads: Supabase Storage, max 5MB, JPEG/PNG/WebP/GIF
- All cover URLs go through `next/image` for optimization

### 11.4 Attribution

Unsplash requires attribution somewhere in the app — at minimum a "Photos from Unsplash" footer link on event pages that use Unsplash photos.

---

## 12. RSVP system

### 12.1 RSVP states

`pending` → `yes` / `no` / `maybe`

`maybe` is shown only if `event.allow_maybe` is true.

### 12.2 Plus-ones

Configured per event: `0` (none), `1`, `2`, `3`. If allowed, the RSVP form shows a "+1?" stepper.

### 12.3 RSVP button styles

Three styles, picked at event creation. Stored in `event.rsvp_button_style`.

| Style    | Going             | Maybe              | Can't go             |
| -------- | ----------------- | ------------------ | -------------------- |
| `emojis` | 👍 Going           | 🤔 Maybe           | 😢 Can't go          |
| `words`  | "Going"           | "Maybe"            | "Can't go"           |
| `minimal`| ✓                | ?                  | ✕                   |

### 12.4 Frictionless submit

- `/[locale]/e/[slug]` shows the event + RSVP form
- Form fields: Name (required if `event.require_names`), Phone (optional), Email (optional, recommended for confirmation), RSVP choice, Plus-ones, Custom questionnaire answers
- Submit → creates `guests` row + `answers` rows → issues `invite_token` → sets cookie → redirects to `/[locale]/e/[slug]?g=<token>`
- Confirmation email sent if email provided

### 12.5 RSVP confirmation page

After submit, show:
- "You're going! 🎉" headline
- Event details
- "Add to calendar" (.ics download)
- "Share with friends" (WhatsApp / Web Share API)
- "Update your RSVP" button (links back to `?g=<token>` URL)

---

## 13. Date polling

### 13.1 Flow

1. Host: "Can't decide when? Poll your guests →" — clicking opens the poll editor
2. Host adds 2-N date options (date + time + optional end time)
3. Poll status = `open`. Event has no fixed `starts_at` yet.
4. Guests see the poll on the event page → multi-select which options work for them
5. Host can see vote tallies in dashboard
6. Host picks the winning option → poll status = `closed`, `event.starts_at`/`ends_at` set, all guests notified

### 13.2 UI in event page

- If poll is open and event has no fixed date: show "📅 We're still picking a date — vote below"
- Each option as a checkbox card with vote count
- Submit votes → confirms

### 13.3 Notification on close

When host closes the poll, all guests receive an email: "The date has been chosen for [event]: [date]. RSVPs are now confirmed."

---

## 14. Questionnaire

Host-defined questions guests answer during RSVP.

### 14.1 Question types

| Type     | UI                                              |
| -------- | ----------------------------------------------- |
| `text`   | Single-line text input                          |
| `single` | Radio buttons (one of N options)                |
| `multi`  | Checkboxes (any of N options)                   |
| `yes_no` | Toggle (Yes / No)                               |

### 14.2 Required vs optional

Each question has `required: bool`. Required questions block RSVP submission until answered.

### 14.3 Editor UI (host)

- "Add question" button
- For each question: label, type selector, options (if applicable), required toggle, drag-handle for reorder

### 14.4 Display in dashboard

Host's guest list view has an "Answers" column or expandable row per guest showing their answers.

---

## 15. Photo album

### 15.1 Flow

- Available **after** the event date passes (auto) OR the host enables it manually
- Anyone with the event link can upload (no account required) — protects against random web crawlers via the slug being non-guessable
- Photos stored in Supabase Storage; thumbnails generated on upload
- Gallery on the event page shows uploaded photos in a grid, click to expand to lightbox

### 15.2 Limits & moderation

- Max 5MB per photo
- JPEG/PNG/WebP/HEIC accepted (HEIC converted to JPEG on upload)
- Host can delete any photo
- Rate limit: 20 uploads per IP per event per day (Supabase Storage policy)

### 15.3 UI

- Standalone page: `/[locale]/e/[slug]/photos`
- Or embedded section on the main event page (small toggle)
- Upload button + drag-drop area
- Gallery: masonry or grid layout, mobile-first

---

## 16. Email notifications

### 16.1 Templates (React Email)

| Template          | Trigger                                        | Recipient        |
| ----------------- | ---------------------------------------------- | ---------------- |
| `invite`          | Host clicks "Send invite" via email            | Specific guest   |
| `rsvp_confirmation` | Guest submits RSVP                           | Guest            |
| `host_new_rsvp`   | New RSVP received                              | Host             |
| `reminder_rsvp`   | 1 week before event (if not yet responded)     | Invited + Maybe  |
| `reminder_event`  | 2 hours before event                           | Going            |
| `event_updated`   | Host edits event details                       | All guests       |
| `event_canceled`  | Host cancels event                             | All guests       |
| `poll_closed`     | Host closes date poll with a winner            | All guests       |

### 16.2 Localization

- Templates exist in Az / Ru / En
- Picked per recipient: use `guest.locale` if known, else fall back to `host.locale`

### 16.3 Cron

- Vercel Cron job runs every hour (or every 15 min for tighter timing on the 2h reminder)
- Scans for events with reminders due in the upcoming window
- Sends via Resend
- Idempotent: each `(reminder_kind, guest_id, event_id)` tuple sent at most once (track in a `sent_reminders` table)

---

## 17. Custom sections (`+ Link / + Playlist / + Registry / + Dress code / + New section`)

Reproduces the Partiful "Show more" + custom field UI.

### 17.1 Pre-built section types

Each is a templated `event_sections` row.

| Kind        | Default icon | Default label    | Value field |
| ----------- | ------------ | ---------------- | ----------- |
| `link`      | link         | "Link"           | URL         |
| `playlist`  | music        | "Playlist"       | URL (Spotify, Apple Music, YouTube Music) |
| `registry`  | gift         | "Registry"       | URL         |
| `dress_code`| shirt        | "Dress code"     | text        |
| `custom`    | (host picks) | (host writes)    | URL or text |

### 17.2 Icon set

`link`, `info`, `music`, `gift`, `shirt`, `utensils`, `car`, `bed`, `phone`, `sparkles` (matches Partiful's icon picker from the screenshot).

### 17.3 Display on event page

Each section renders as: `[icon] [label] → [value]` with the value either as a link button or inline text.

### 17.4 Reordering

Drag-handle in the host editor; `order_index` updates on drop.

---

## 18. Event settings (the modal with sidebar)

Reproduces Partiful's Event Settings modal. 7 tabs. Open via "Settings" rail button on the event editor.

### 18.1 Hosts (P1)

Defer to v1.5. Just show a stub "Cohosts coming soon" if needed.

### 18.2 RSVPs

- Accept RSVPs (master toggle → if off, guests see event but can't respond)
- Plus-ones (None / Up to 1 / Up to 2 / Up to 3)
- Require names (toggle)
- Max capacity (number, blank = unlimited)
- RSVP button style (Emojis / Words / Minimal)
- Allow "Maybe" (toggle)

### 18.3 Questionnaire

Manage questions for the event (see §14).

### 18.4 Display & Privacy

- Show Activity Timestamps (toggle)
- Show Guest Names (toggle)
- Show Guest Count (toggle)
- Event Password (Off / Set passphrase) — if set, guests must enter before viewing event details

### 18.5 Audience

- Who can find this event?
  - **Private** — only people with the link
  - **Public** — visible on host's profile page (but no Explore feed in v1)

### 18.6 Photo Album

- Enable Photo Album (toggle)
- Auto-enable after event time (toggle)

### 18.7 Chip in

- Free-text field (host pastes IBAN, m10 link, Birbank QR URL, etc.)
- Disclaimer shown: "Payments are not verified. Guests self-report payment during RSVP."

### 18.8 Auto-Reminders

- Enable Reminders (master toggle)
- Two presets shown:
  - "Reminders to RSVP — 1 week before event — Invited + Maybe"
  - "Event Reminders — 2 hours before event — Going"
- Sent via **email** in v1 (we removed SMS from the original Partiful design)

---

## 19. Privacy & display rules

### 19.1 Location privacy

Per event: `location_hidden_until_rsvp: bool` (default true).
- If true: location field shows "🔒 Location · hidden before RSVP" on the event page
- After guest RSVPs (yes or maybe), location is revealed
- For "no" RSVPs: location stays hidden

### 19.2 Guest list display

Three independent toggles (per event):
- `show_guest_names` — show actual names vs. "12 going"
- `show_guest_count` — show counts at all
- `show_timestamps` — show "Jane RSVP'd 2h ago" vs. just the avatar

### 19.3 Event password

- Optional passphrase field
- Hashed (bcrypt) and stored in `event.event_password`
- If set: `/[locale]/e/[slug]` shows a password gate before any event details
- Password stored in cookie after correct entry → no re-prompt for that browser

---

## 20. Profile & host pages

### 20.1 Profile menu (top-right of authenticated nav)

Items:
- View profile
- Switch profile (P1 — assume one profile per user in v1)
- + New event
- Feedback (mailto: link or simple form)
- Help Center (static page)
- Profile Settings
- Log out

### 20.2 Profile settings

- Display name
- Avatar (upload to Supabase Storage)
- Locale preference (Az / Ru / En)
- Email (read-only; managed by Supabase Auth)
- Phone (optional)
- Delete account (P1)

### 20.3 Public profile page

`/[locale]/u/[username]` shows host's public events (those with `audience = 'public_profile'` and `status = 'published'`). For v1, no follow/mutual mechanics — just a list.

---

## 21. i18n strategy

### 21.1 Locales

- `az` — Azerbaijani (default)
- `ru` — Russian
- `en` — English

### 21.2 Routing

- `next-intl` middleware with locale prefix: `/az/...`, `/ru/...`, `/en/...`
- Browser language detection on `/` → redirect to best match
- Footer locale switcher → updates cookie + redirects to same path under new locale

### 21.3 What translates vs. what doesn't

| Translated                          | NOT translated                       |
| ----------------------------------- | ------------------------------------ |
| All UI labels, buttons, errors      | Event titles, descriptions, q&a      |
| Email templates                     | Custom section labels (host writes)  |
| Date/time formatting (per locale)   | Theme/effect/font names (English-only) |
| Generated share message templates   | User-uploaded text                   |

### 21.4 Translation file structure

```
messages/
├── az.json
├── ru.json
└── en.json
```

Hierarchical keys: `event.create.title`, `rsvp.button.going`, `email.reminder.subject`.

### 21.5 Date/time

- `date-fns` locale packs: `az`, `ru`, `enUS`
- All times stored as UTC, displayed in `Asia/Baku` (UTC+4, no DST)
- Format strings: `EEEE, MMMM d, yyyy 'at' h:mm a` (English) — locale-equivalent for Az/Ru

---

## 22. File structure

```
.
├── app/
│   ├── [locale]/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── auth/callback/route.ts
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── events/
│   │   │   │   ├── page.tsx              # list of host's events
│   │   │   │   ├── new/page.tsx          # create event (redirects to manage)
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx          # manage event (the big editor)
│   │   │   │       ├── guests/page.tsx
│   │   │   │       ├── questions/page.tsx
│   │   │   │       ├── poll/page.tsx
│   │   │   │       ├── photos/page.tsx
│   │   │   │       └── settings/page.tsx
│   │   │   └── settings/page.tsx         # profile settings
│   │   ├── (public)/
│   │   │   ├── e/[slug]/page.tsx         # public event page + RSVP
│   │   │   ├── e/[slug]/photos/page.tsx
│   │   │   └── u/[username]/page.tsx     # public profile (P1)
│   │   ├── layout.tsx
│   │   └── page.tsx                      # marketing/landing
│   ├── api/
│   │   ├── ics/[slug]/route.ts           # calendar export
│   │   ├── og/[slug]/route.ts            # OG image generation
│   │   └── cron/reminders/route.ts       # Vercel cron handler
│   └── globals.css
├── components/
│   ├── ui/                               # shadcn primitives
│   ├── event/
│   │   ├── EventEditor.tsx
│   │   ├── EventPage.tsx
│   │   ├── EventTitle.tsx                # font + color + effect renderer
│   │   ├── ThemeBackground.tsx
│   │   ├── EffectOverlay.tsx
│   │   ├── CoverImagePicker.tsx
│   │   ├── ThemePicker.tsx
│   │   ├── EffectPicker.tsx
│   │   ├── FontPicker.tsx
│   │   ├── CustomSections.tsx
│   │   └── EventSettingsModal.tsx
│   ├── rsvp/
│   │   ├── RSVPForm.tsx
│   │   ├── RSVPButtons.tsx
│   │   └── RSVPConfirmation.tsx
│   ├── share/
│   │   ├── ShareButton.tsx
│   │   ├── WhatsAppShareButton.tsx
│   │   └── ShareSheet.tsx
│   ├── poll/
│   │   ├── DatePollEditor.tsx
│   │   ├── DatePollVoter.tsx
│   │   └── DatePollResults.tsx
│   ├── photos/
│   │   ├── PhotoUploader.tsx
│   │   └── PhotoGallery.tsx
│   ├── effects/
│   │   ├── TsParticlesEffect.tsx
│   │   └── PartyclesReward.tsx
│   └── layout/
│       ├── LocaleSwitcher.tsx
│       └── ProfileMenu.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                     # browser client
│   │   ├── server.ts                     # server client (cookies)
│   │   └── service.ts                    # service role (admin only)
│   ├── schemas/                          # Zod schemas
│   │   ├── event.ts
│   │   ├── guest.ts
│   │   ├── rsvp.ts
│   │   └── ...
│   ├── whatsapp.ts                       # wa.me URL builder
│   ├── ics.ts                            # iCalendar generation
│   ├── slug.ts                           # short slug generation
│   ├── unsplash.ts                       # Unsplash API client
│   ├── email.ts                          # Resend wrapper
│   └── utils.ts                          # cn(), formatDate(), etc.
├── messages/
│   ├── az.json
│   ├── ru.json
│   └── en.json
├── emails/                               # React Email templates
│   ├── Invite.tsx
│   ├── RsvpConfirmation.tsx
│   ├── HostNewRsvp.tsx
│   ├── ReminderRsvp.tsx
│   ├── ReminderEvent.tsx
│   ├── EventUpdated.tsx
│   ├── EventCanceled.tsx
│   └── PollClosed.tsx
├── supabase/
│   ├── migrations/                       # SQL migrations (numbered)
│   └── seed.sql                          # default themes/effects/fonts
├── public/
│   └── patterns/                         # SVG pattern assets
├── middleware.ts                         # locale + auth
├── i18n.ts                               # next-intl config
├── next.config.ts
├── tailwind.config.ts                    # if using v3; v4 may differ
├── CLAUDE.md
├── PRODUCT_SPEC.md                       # this file
├── README.md
├── .env.example
└── package.json
```

---

## 23. Conventions

### 23.1 Golden rules

1. **One change per prompt.** Multi-phase mega-prompts fail silently. Test between prompts.
2. **Never confidently wrong.** Verify with `web_search` before writing if uncertain.
3. **Server-first.** Server Components by default; `'use client'` only for genuine interactivity.
4. **Server Actions for mutations.** No bare REST API routes for CRUD.
5. **Zod everywhere.** Validate every form input, Server Action arg, external payload.
6. **RLS is mandatory.** No `service_role` outside admin/cron. RLS + Server Action validation = defense in depth.
7. **Mobile-first.** Design for 360px width.
8. **i18n from day one.** Every string through `useTranslations()` / `getTranslations()`.
9. **No premature optimization.** No Drizzle, tRPC, React Query in v1.
10. **Error + loading states are P0** for every data-fetching component.

### 23.2 Naming

- Files: `kebab-case.tsx` for routes, `PascalCase.tsx` for components, `camelCase.ts` for utilities
- DB columns: `snake_case`
- TS types: `PascalCase`
- Translation keys: `dot.case.hierarchical`

### 23.3 Git workflow

- Branch per prompt: `feat/01-scaffold`, `feat/02-supabase-auth`, etc.
- Commit per prompt: `[01] scaffold next.js project`
- Test → commit → next prompt

### 23.4 Component sizing

- A component file > 300 lines is a smell. Split.
- A Server Action with > 50 lines of logic is a smell. Extract to `lib/`.

---

## 24. Build roadmap (sequential prompts)

Each prompt is one focused change. Test after every prompt. Don't combine.

| #   | Prompt                                          | Output                                                       |
| --- | ----------------------------------------------- | ------------------------------------------------------------ |
| 1   | Project scaffolding + tooling                   | `pnpm dev` runs, locale routing works, shadcn ready          |
| 2   | Supabase wiring + auth                          | Login page works (magic link + Google), profile auto-created |
| 3   | DB schema migration + types                     | All tables created, RLS enabled, TS types generated          |
| 4   | Themes + Effects + Fonts seed                   | Catalog rows in DB, types exported                           |
| 5   | Theme renderer + Effect renderer + Font renderer (event page primitives) | Standalone test page renders any theme/effect/font combo |
| 6   | Theme picker UI + Effect picker UI + Font picker UI | Pickers work in isolation                                |
| 7   | Cover image picker (library + Unsplash + upload)| Picker fully wired                                           |
| 8   | Event creation flow (form + Server Action)      | Host can create event, slug generated, redirect to manage    |
| 9   | Public event page (read-only render)            | Anyone with link sees themed event                           |
| 10  | RSVP form on event page                         | Guests can RSVP, `guests` row created, token issued          |
| 11  | RSVP confirmation page + email                  | Confirmation flow complete                                   |
| 12  | Host dashboard: event list + manage page        | Host sees their events, edits basic fields                   |
| 13  | Custom sections (Link/Playlist/Registry/Dress code/Custom) | Host adds sections, they render on event page         |
| 14  | Guest list management (host)                    | Host adds guests manually, sees RSVPs, copies invite links   |
| 15  | WhatsApp share + Web Share API                  | Share buttons work, per-guest invite URLs                    |
| 16  | Calendar export (.ics)                          | Add to calendar works                                        |
| 17  | Event Settings modal (all 7 tabs)               | Settings persist, affect event display                       |
| 18  | Custom questionnaire                            | Host adds questions, guests answer                           |
| 19  | Date polling                                    | Host proposes options, guests vote, host picks               |
| 20  | Photo album                                     | Guests upload, gallery displays                              |
| 21  | Email: confirmations + reminders (Resend + cron)| Resend integrated, cron triggers reminders                   |
| 22  | i18n full coverage (Az + Ru + En translations)  | Every UI string translated, locale switcher works            |
| 23  | Production polish: SEO, OG images, error pages, prefers-reduced-motion | Ready to deploy                          |
| 24  | Deploy to Vercel + custom domain                | Live at parti.az                                             |

Each prompt → branch → commit → test → next.

---

## 25. Definition of done for v1

- [ ] A host can sign up, create a themed event, and share it via WhatsApp in under 90 seconds
- [ ] A guest can RSVP from a link in under 15 seconds, no account
- [ ] The event page looks good on a 360px-wide phone in all three locales (Az/Ru/En)
- [ ] Theme + Effect + Font + Color combine correctly on the event page
- [ ] Cover image picker pulls from Unsplash and supports uploads
- [ ] Custom sections render with correct icons
- [ ] Date polling produces a clear winner; all guests notified
- [ ] Custom questionnaire collects and displays answers
- [ ] Photo album: guests can upload, host can moderate
- [ ] Host receives email on every new RSVP
- [ ] Guests receive RSVP confirmation, 1-week-before, and 2-hour-before reminders
- [ ] Edit/cancel flows trigger guest notifications
- [ ] All 7 Event Settings tabs functional (Hosts is P1, others P0)
- [ ] No `service_role` keys in client code; RLS enforced everywhere
- [ ] Lighthouse mobile: performance > 85, accessibility > 95
- [ ] `prefers-reduced-motion` disables effects
- [ ] Deployed to parti.az with SSL

---

## 26. Open items / things to verify late

- **WhatsApp Cloud API in v2** — when traction justifies setup. Azerbaijan sits in Meta's "Rest of Central & Eastern Europe" pricing tier.
- **Payment integrations** — if hosts ask for it, evaluate Stripe (international) vs local m10/Birbank/iyzico/IBAN.
- **PWA** — installable, offline event viewing, push notifications. Likely the right next step after v1 launches.
- **A2P 10DLC** — not relevant since we skipped SMS.
- **Font glyph audit** — verify each font renders Az diacritics + Cyrillic before launch.
- **Unsplash API approval** — apply for production tier (5000 req/h) once ready to launch.
- **Bundle size on the public event page.** `/dev/themes` First Load is 233KB due to `@tsparticles/all`. The public event page (Prompt 09) will use the same EffectOverlay component. If First Load there exceeds ~200KB on production builds, dynamic-import the EffectOverlay so particles load after first paint, OR switch to `loadSlim` + explicit plugin imports for our 7 plugin-dependent effects. Watch this when Prompt 09 lands.
