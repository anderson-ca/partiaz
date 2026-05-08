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

## Git commits

When you commit on this project:

- Do NOT add `Co-Authored-By: Claude <noreply@anthropic.com>` trailers. The user does not want Claude listed as a contributor on GitHub.
- Do NOT add `🤖 Generated with [Claude Code](...)` trailers.
- Commit messages should be the user's voice — concise, technical, no AI attribution.
- Commit message format: `[NN] short description in imperative mood` where NN is the prompt number (e.g. `[02] add supabase auth and profiles table`).
- One commit per completed prompt unless the user says otherwise.
