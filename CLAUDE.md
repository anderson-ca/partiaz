# CLAUDE.md — parti.az

Operational manual for Claude Code. The full product specification lives in `PRODUCT_SPEC.md` — read it before any non-trivial change. This file is the short version.

---

## What this is

**parti.az** — a Partiful-style event invitation and RSVP web app, localized for Baku, Azerbaijan. Mobile-first responsive web. WhatsApp `wa.me` share links instead of SMS. Multilingual (Az/Ru/En) from day one. Solo dev, AI-assisted workflow.

## Stack

- **Next.js 15** (App Router) + **TypeScript** (strict)
- **Tailwind CSS v4** + **shadcn/ui** (new-york style, neutral base)
- **Supabase** (Postgres, Auth, Storage, Realtime)
- **Resend** + **React Email** for transactional email
- **next-intl** for i18n
- **Vercel** for hosting + cron
- **pnpm** as package manager

Key libs: `react-hook-form`, `zod`, `date-fns` + `date-fns-tz`, `framer-motion`, `@tsparticles/react`, `partycles`, `react-colorful`, `splittypejs`, `lucide-react`.

## Deviations from generic stack defaults

When future prompts reference standard setup patterns, remember these specifics for this project:

- **Tailwind v4** — no `tailwind.config.ts`. Theme tokens go in `app/globals.css` via the `@theme` directive.
- **next-intl v4 layout** — config is split into `i18n/routing.ts` and `i18n/request.ts`, not a single `i18n.ts`.
- **Next.js 15 (not 16)** — uses `middleware.ts`, not `proxy.ts`. Do not upgrade to 16 without explicit instruction.
- **shadcn preset** — see `components.json` for actual style/baseColor. The preset name in use is `radix-nova` (Radix-backed, neutral).
- **Node 22.x required** (pnpm 11 dependency). `.nvmrc` pins the exact version.
- **`pnpm-workspace.yaml`** includes an `allowBuilds` list. Append package names there if pnpm complains about unapproved native build scripts during install.
- **`turbopack.root`** is pinned to `__dirname` in `next.config.ts` to avoid workspace-root warnings.

### Schema name realities

Some Prompt 03 column names diverge from intuitive guesses. Use the real names — schema renames "for clarity" aren't worth the migration cost.

**`guests` table:**
- `rsvp` — enum status field (NOT `rsvp_status`)
- `claimed_user_id` — FK to authenticated user's profile (NOT `profile_id`)
- `responded_at` — bumped on each RSVP update (NOT `updated_at`)
- `guest_message` — guest's optional note to host (added in Prompt 10)
- `invite_token` — globally unique, used for anon identity via httpOnly cookie

**`events` table:**
- `starts_at` / `ends_at` — plural (NOT `start_at` / `end_at`)
- `location_text` — venue name (NOT `location_name`)
- `location_address` — street address (added in Prompt 09.84)
- `location_hidden_until_rsvp` — defaults to `false` (was `true` until 10.1's backfill)
- Two FKs to `font_presets` (`font_preset_id`, `cover_overlay_font_id`). PostgREST joins MUST disambiguate via `font_presets!events_font_preset_id_fkey` etc. — see "PostgREST FK disambiguation" below if you hit it.

**`event_cohosts` table:**
- Composite PK on `(event_id, user_id)` — no synthetic `id` column
- `user_id` (NOT `profile_id`) is the FK into `profiles`

**`profiles` table:**
- `profiles.phone` has a partial unique index `WHERE phone IS NOT NULL`. Multiple NULL phones allowed (most email-only accounts); collisions only enforced on non-NULL values.
- The `handle_new_user` insert trigger (extended in Prompt 10.5) mirrors `auth.users.phone` → `profiles.phone` alongside display_name/avatar. Phone-only signups get their phone in `profiles` automatically — no app-layer sync needed at signup time.

**Reserved-but-unwired columns** (don't propose features on them without checking PRODUCT_SPEC and asking — schema exists but UI doesn't):
- `events.event_password`, `events.is_tbd`, `events.audience='public_profile'`
- `guests.plus_one_count`, `guests.host_notes`, `guests.invited_at`

### Phone auth

OTP-based phone sign-in lives alongside magic link + Google OAuth. Architecture details future prompts must respect:

- Provider is **Twilio Verify** (NOT regular Twilio with Messaging Service). Configured in Supabase Auth → Providers → Phone.
- Channel selection (SMS vs WhatsApp) lives in the Twilio Verify Service dashboard config, NOT in app code. Always call `supabase.auth.signInWithOtp({ phone })` without an explicit `channel` parameter. Do not hardcode channel anywhere.
- WhatsApp delivery requires a WhatsApp Business Account (WBA) sender attached to the Verify Service. WBA verification is in progress separately. SMS is the effective channel until WBA approves; flipping to WhatsApp requires only Twilio dashboard config, no app code changes.
- `lib/phone.ts` exports `formatPhoneDisplay` (libphonenumber-js `formatInternational` — produces output like `+994 50 123 45 67`) and `normalizePhone`, which walks a default-country list (`AZ, US, RU, TR, GE, UA` in order — AZ primary audience, then realistic guest origins for Baku events) and returns the first valid parse. Explicit `+994…` / `+1…` wins on the first iteration regardless. Bare digits without `+` falling outside the default list hit a last-resort `+`-prepend international fallback. Country-selector dropdown remains the eventual real fix.
- The `verifyPhoneOtp` action syncs phone → profiles on every sign-in (idempotent UPDATE). There is no separate `syncProfilePhone` action.

### Tailwind v4 utility renames (vs v3)

Verified against the official upgrade guide: https://tailwindcss.com/docs/upgrade-guide. The IDE flags v3 names with a `suggestCanonicalClasses` warning on every edit — use the v4 names from the start to avoid review noise.

**Size-shift renames** (default scales gained an `xs` step; the old `sm` slid down to `xs`, the unsuffixed default became `sm`):

- `shadow-sm` → `shadow-xs` ; `shadow` → `shadow-sm`
- `drop-shadow-sm` → `drop-shadow-xs` ; `drop-shadow` → `drop-shadow-sm`
- `blur-sm` → `blur-xs` ; `blur` → `blur-sm`
- `backdrop-blur-sm` → `backdrop-blur-xs` ; `backdrop-blur` → `backdrop-blur-sm`
- `rounded-sm` → `rounded-xs` ; `rounded` → `rounded-sm`

**Gradients** (namespaced by gradient kind):

- `bg-gradient-to-{dir}` → `bg-linear-to-{dir}`
- New siblings: `bg-radial-{at-…}` and `bg-conic-{angle}` for radial / conic gradients

**Outline:**

- `outline-none` → `outline-hidden` (v4's `outline-none` now literally removes the outline; `outline-hidden` keeps the v3 transparent-but-present behavior commonly used for focus-visible styles)

**Ring** (defaults changed):

- `ring` is now `1px` / `currentColor` by default (was `3px` / `blue-500`)
- To get the v3 default: `ring-3` plus an explicit color utility

**Removed deprecated utilities** (replacements):

- `bg-opacity-*` / `text-opacity-*` → opacity modifier (`bg-black/50`)
- `flex-shrink-*` → `shrink-*`
- `flex-grow-*` → `grow-*`
- `overflow-ellipsis` → `text-ellipsis`
- `decoration-slice` → `box-decoration-slice`
- `decoration-clone` → `box-decoration-clone`

## Commands

```
pnpm dev            # dev server (Turbopack)
pnpm build          # production build
pnpm lint           # ESLint
pnpm typecheck      # tsc --noEmit
pnpm db:push        # apply Supabase migrations
pnpm db:types       # regenerate TS types from schema
pnpm email:dev      # React Email preview server
```

(Some of these scripts get added in their respective setup prompts — they don't all exist on day one.)

---

## Golden rule: ONE change per prompt

Multi-phase mega-prompts fail silently. Each prompt does ONE thing. Test between prompts. Never combine unrelated changes.

If a prompt seems to want multiple things, push back: "Should I split this into N prompts?"

---

## Non-negotiables

1. **Never confidently wrong.** If you're unsure about a library version, syntax, or API behavior, say so and verify with `web_search` BEFORE writing code. The user has been burned by confident guesses — don't add to the pile.
2. **Server-first.** Server Components by default. `'use client'` only when interactivity demands it (state, effects, browser APIs).
3. **Server Actions for mutations.** No bare REST API routes for CRUD. Reserve `app/api/*` for: webhooks, ICS export, OG images, cron handlers.
4. **Zod everywhere.** Validate every form input, Server Action arg, and external payload. Schemas live in `lib/schemas/`, imported by both client and server.
5. **RLS is mandatory.** Every user-facing query goes through Supabase RLS. `service_role` only in admin/cron contexts. Defense in depth: Server Actions also verify ownership/tokens.
6. **Mobile-first.** Design for 360px width. Add `sm:`/`md:` only when needed.
7. **i18n from day one.** Every user-facing string goes through `useTranslations()` / `getTranslations()`. Never hardcode UI text. New strings require entries in `messages/{az,ru,en}.json`.
8. **No premature optimization.** No Drizzle, no tRPC, no React Query in v1. Plain Server Components + Server Actions + Supabase JS client.
9. **Error + loading states are P0** for every data-fetching component. Use Next.js `loading.tsx` and `error.tsx` at route level.
10. **`prefers-reduced-motion` disables effects.** Don't ship animations that ignore this.
11. **Server-only secret clients use `import 'server-only'`.** Any module that touches `SUPABASE_SECRET_KEY` (or any other server secret) must import `'server-only'` at the top. This makes Next.js throw a build error if a client component accidentally imports it. Defense in depth beyond RLS — see `lib/supabase/service.ts` for the canonical pattern.

---

## Verify with `web_search` before writing

These change frequently and getting them wrong wastes time:

- Next.js 15 / React 19 setup commands and config
- Tailwind v4 install steps (changed materially from v3)
- next-intl App Router setup (v3 vs v4 syntax differs)
- shadcn/ui CLI flags and component installs
- Supabase Auth + Next.js App Router cookie handling (has had several iterations)
- Resend with React Email — current API
- Vercel cron syntax in `vercel.json`
- `@tsparticles/react` latest API and preset names
- `partycles` (`useReward`) hook signature

When in doubt, search.

---

## File structure (high level)

See `PRODUCT_SPEC.md §22` for the full tree.

```
app/[locale]/{(auth),(dashboard),(public)}/...
components/{ui,event,rsvp,share,poll,photos,effects,layout}
lib/{supabase,schemas,whatsapp,ics,slug,unsplash,email,utils}
messages/{az,ru,en}.json
emails/...
supabase/migrations/...
```

---

## Conventions for incoming prompts

When the user gives me a prompt, it should:

- State **ONE** goal clearly
- List affected files explicitly
- Specify any new dependencies
- Reference `PRODUCT_SPEC.md` sections by number when relevant
- Define what "done" looks like (build passes? typecheck? specific behavior verified?)

If a prompt is ambiguous, ask one clarifying question before coding. Don't guess.

---

## Things this app explicitly does NOT do

(So I don't accidentally build them)

- SMS — replaced entirely by `wa.me` share links + email
- Native iOS/Android apps
- WhatsApp Cloud API (programmatic templates)
- In-app payments
- Public Explore feed / discovery
- Mutuals (social graph)
- Push notifications
- "Send a card" feature (Partiful has it; we don't)

---

## Known limitations

Things that work but are intentionally rough; document so future prompts don't waste time "fixing" them as bugs.

- **Duplicate identities across auth methods.** Same person signing up via email AND via phone creates two `auth.users` rows. The `profiles.phone` partial unique index prevents two profiles from claiming the same non-NULL phone, but `auth.users` itself does not merge identities. Future "link phone to email account" feature is out of scope for v1.

---

## Definition of done (per prompt)

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` passes
- [ ] The specific behavior the prompt asked for works in `pnpm dev`
- [ ] No console errors in the browser
- [ ] Mobile viewport (360px) renders correctly if UI was touched
- [ ] No unrelated changes

---

## Catalog renderer rules

These are subtle gotchas around the theme/effect/font catalog that are easy to get wrong in refactors. Don't violate them without a deliberate reason.

1. **`background_value->>'url'` is opaque.** Treat URLs from theme rows as fully-formed strings. Never reconstruct them from `photo_id` or assume the prefix is `images.unsplash.com/photo-` — some are `/flagged/photo-` paths. The CDN URL is canonical; the photo_id is for attribution only.

2. **`@tsparticles/all` is the deliberate choice for `loadAll`.** Do NOT refactor to `loadSlim` "for performance" — 7 of 14 effects break. If bundle size needs trimming, use `loadSlim` + explicit per-plugin imports for shape: char (Hearts/Petals/Emoji rain/Balloons) and destroy.split + move.gravity.inverse (Fireworks).

3. **Catalog updates are append-only migrations.** Do not edit `20260507211248_seed_catalog.sql` to fix bad data — write a new migration (e.g. `fix_effect_configs.sql`). Once a migration has been pushed to remote, its history is locked.

---

## CSS Grid pitfalls

Tailwind's `grid-cols-[Xfr_Yfr]` compiles to `minmax(auto, Xfr)` per column. The `auto` minimum means any column with intrinsic content wider than its fractional share (horizontal scrollers, long unbroken strings, picker pill rows, code blocks) will blow the column out — pushing other columns or escaping the container entirely.

When a two-column grid contains content with its own intrinsic width:

- Use `grid-cols-[minmax(0,1fr)_minmax(0,1fr)]` (or any explicit `minmax(0, …)`) instead of `grid-cols-[1fr_1fr]` or `grid-cols-[3fr_2fr]`.
- Add `min-w-0` to direct children of the grid item so any flex / scroll containers inside also respect the column boundary.

Hit in Prompt 06.6 — FontPicker (10 pills × ~120px) blew the left column wide enough to push the right column under the floating rail.

---

## shadcn / Radix conventions

When a custom component is the trigger for a Radix primitive that uses `asChild` (`DialogTrigger`, `SheetTrigger`, `PopoverTrigger`, `TooltipTrigger`, `DropdownMenuTrigger`, etc.), that custom component MUST forward props AND ref to the underlying DOM element. Radix uses `React.cloneElement` to attach `onClick`, `onKeyDown`, `aria-*`, and refs — if the component drops them, the trigger silently breaks (button looks correct, never fires).

Canonical pattern for any custom trigger:

```tsx
const RailButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<'button'>
>(({ children, ...props }, ref) => (
  <button ref={ref} {...props}>
    {children}
  </button>
))
RailButton.displayName = 'RailButton'
```

If a Radix-wrapped trigger ever "doesn't respond," this is the first thing to check. We hit this in Prompt 06.6 — Theme/Effect rail buttons looked fine, fired nothing, because props weren't spread.

### Floating surface convention

Any UI element that floats over the themed page background — Popover, Sheet, Dialog content, DropdownMenu, CommandList, Tooltip, etc. — MUST use `FLOATING_SURFACE` from `lib/ui/floating-surface.ts` for its content card. Do NOT use shadcn's default `bg-popover` / `bg-card` tokens. They resolve to white-on-light in our setup, which renders illegibly over a themed background.

Inside a FLOATING_SURFACE container, child elements that would otherwise reference shadcn neutral tokens (`text-foreground`, `bg-muted`, `ring-foreground`, `text-destructive`, etc.) MUST be remapped to explicit equivalents. Use the `ON_FLOATING` map in the same file as the canonical mapping.

This applies project-wide. Even ostensibly-default shadcn primitives (DropdownMenuContent, CommandList, etc.) wear FLOATING_SURFACE in our pages.

Hit in Prompt 06.7 — every picker had to ad-hoc remap shadcn tokens to read correctly on the dark themed page.

### Responsive Radix wrappers — defer until mount

Conditionally rendering different Radix primitives based on viewport (Sheet on mobile, Popover on desktop, switched via `useMediaQuery`) corrupts Radix's internal `useId()` counter on hydration. The SSR pass and the post-mount pass produce different sequences of `useId` calls; downstream Radix components — even ones unrelated to the responsive wrapper — get mismatched aria-controls / aria-describedby ids and silently break accessibility relationships.

Symptom: React hydration warnings, broken aria associations, sometimes-unrelated sibling Radix components (e.g. a sibling Popover) getting wrong ids.

Pattern: render only the bare trigger during SSR and first paint. Defer mounting the Radix wrapper until a `mounted` flag flips in a mount effect. SSR + first-paint output is stable (no Radix-generated ids in the first pass); post-mount renders deterministically pick the right wrapper.

```tsx
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])

if (!mounted) return <>{trigger}</>

return isDesktop
  ? <Popover>...</Popover>
  : <Sheet>...</Sheet>
```

Applies to ANY responsive Radix swap. Hit in Prompt 06.8 — ResponsivePicker's Sheet/Popover swap broke ColorPicker's id sequence until we deferred the wrapper.

---

## Git commits

When you commit on this project:

- Do NOT add `Co-Authored-By: Claude <noreply@anthropic.com>` trailers. The user does not want Claude listed as a contributor on GitHub.
- Do NOT add `🤖 Generated with [Claude Code](...)` trailers.
- Commit messages should be the user's voice — concise, technical, no AI attribution.
- Commit message format: `[NN] short description in imperative mood` where NN is the prompt number (e.g. `[02] add supabase auth and profiles table`).
- One commit per completed prompt unless the user says otherwise.
