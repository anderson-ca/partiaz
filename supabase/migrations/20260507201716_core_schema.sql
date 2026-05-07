-- ============================================================================
-- Core schema for parti.az
-- ============================================================================
-- This migration adds every domain table for v1 (events, guests, RSVPs,
-- questionnaires, date polls, photos, host messaging, reminders) plus the
-- catalog tables for themes / effects / fonts (rows seeded in prompt 04).
--
-- RLS strategy
-- ------------
-- Authenticated host writes (events and everything that follows an event)
-- are enforced via auth.uid() = host_id (or via a sub-select against events).
--
-- Public reads of "published" events and their dependent rows (sections,
-- questions, polls, photos) are allowed for both anon and authenticated.
--
-- Unauthenticated guest writes (RSVP submission, vote, photo upload, answer)
-- are NOT permitted via RLS. Guest invite_token validation happens in Server
-- Actions, which then mutate via the secret-key (service-role) client.
-- This keeps the trust boundary in application code and avoids leaking the
-- token to the database header layer. PRODUCT_SPEC.md §5.2 already mandates
-- "Server Actions validate ownership/tokens before mutating" — RLS here is
-- the second layer.
--
-- Naming convention for policies: <table>_<actor>_<action>
--   actor: owner | published | host | public | authenticated
--   action: select | insert | update | delete | all
-- ============================================================================


-- ============================================================================
-- 1. Catalog tables (no FKs to events; seeded in prompt 04)
-- ============================================================================

create table public.themes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('dark', 'light', 'trending', 'fun', 'seasonal')),
  background_type text not null check (background_type in ('gradient', 'unsplash', 'pattern', 'solid')),
  background_value jsonb not null,
  recommended_text_color text not null,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create table public.effects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('fun', 'classic', 'trending', 'seasonal')),
  engine text not null check (engine in ('tsparticles', 'css')),
  config jsonb not null,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create table public.font_presets (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('classic', 'eclectic', 'fancy', 'literary', 'digital', 'elegant')),
  name text not null,
  font_family text not null,
  font_weight int not null,
  letter_spacing text not null default '0',
  text_transform text not null default 'none' check (text_transform in ('none', 'uppercase', 'capitalize')),
  supports_az bool not null default false,
  supports_ru bool not null default false,
  created_at timestamptz not null default now()
);


-- ============================================================================
-- 2. Events
-- ============================================================================

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  host_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default '',
  description text,
  theme_id uuid not null references public.themes(id) on delete restrict,
  theme_color_override text,
  effect_id uuid references public.effects(id) on delete set null,
  font_preset_id uuid not null references public.font_presets(id) on delete restrict,
  text_color text not null default '#ffffff',
  text_effect text not null default 'none',
  cover_image_url text,
  cover_image_source text check (cover_image_source in ('library', 'unsplash', 'upload')),
  starts_at timestamptz,
  ends_at timestamptz,
  is_tbd bool not null default false,
  timezone text not null default 'Asia/Baku',
  location_text text,
  location_url text,
  location_hidden_until_rsvp bool not null default true,
  capacity int,
  plus_ones int not null default 0,
  allow_maybe bool not null default true,
  require_names bool not null default true,
  rsvp_button_style text not null default 'emojis' check (rsvp_button_style in ('emojis', 'words', 'minimal')),
  cost_per_person_text text,
  chip_in_text text,
  event_password text,
  audience text not null default 'private' check (audience in ('private', 'public_profile')),
  show_guest_names bool not null default true,
  show_guest_count bool not null default true,
  show_timestamps bool not null default true,
  reminders_enabled bool not null default true,
  status text not null default 'draft' check (status in ('draft', 'published', 'canceled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.events.slug is '6–8 char base62 short slug (e.g. qbk5x9). Generated by lib/slug.ts.';
comment on column public.events.event_password is 'bcrypt hash. Compared in Server Action — never returned to client.';

-- Cohosts (P1 — schema only, no UI yet)
create table public.event_cohosts (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table public.event_sections (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  kind text not null check (kind in ('link', 'playlist', 'registry', 'dress_code', 'custom')),
  icon text not null check (icon in ('link', 'info', 'music', 'gift', 'shirt', 'utensils', 'car', 'bed', 'phone', 'sparkles')),
  label text not null,
  value_url text,
  value_text text,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);


-- ============================================================================
-- 3. Guests + questionnaire
-- ============================================================================

create table public.guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null default '',
  phone text,
  email text,
  rsvp text not null default 'pending' check (rsvp in ('pending', 'yes', 'no', 'maybe')),
  plus_one_count int not null default 0,
  invite_token text not null unique,
  claimed_user_id uuid references public.profiles(id) on delete set null,
  invited_at timestamptz,
  responded_at timestamptz,
  host_notes text,
  created_at timestamptz not null default now()
);

comment on column public.guests.invite_token is '24-char URL-safe random. Validated in Server Actions; not used in RLS.';
comment on column public.guests.host_notes is 'Private to host. Never returned to public/guest queries.';

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  label text not null,
  type text not null check (type in ('text', 'single', 'multi', 'yes_no')),
  options jsonb,
  required bool not null default false,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

comment on column public.questions.options is 'jsonb array of strings; only meaningful for type in (single, multi).';

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  guest_id uuid not null references public.guests(id) on delete cascade,
  value jsonb not null,
  created_at timestamptz not null default now(),
  unique (question_id, guest_id)
);


-- ============================================================================
-- 4. Date polls
-- ============================================================================

create table public.date_polls (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'closed')),
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.date_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.date_polls(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.date_votes (
  id uuid primary key default gen_random_uuid(),
  option_id uuid not null references public.date_options(id) on delete cascade,
  guest_id uuid not null references public.guests(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (option_id, guest_id)
);


-- ============================================================================
-- 5. Photos
-- ============================================================================

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  uploader_guest_id uuid references public.guests(id) on delete set null,
  uploader_user_id uuid references public.profiles(id) on delete set null,
  storage_path text not null,
  thumbnail_path text,
  width int not null,
  height int not null,
  created_at timestamptz not null default now()
);


-- ============================================================================
-- 6. Messaging + cron idempotency
-- ============================================================================

create table public.event_messages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  sender_user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  audience_filter text not null check (audience_filter in ('all', 'going', 'maybe', 'invited')),
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.sent_reminders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  guest_id uuid not null references public.guests(id) on delete cascade,
  reminder_kind text not null check (reminder_kind in ('rsvp_1week', 'event_2hour')),
  sent_at timestamptz not null default now(),
  unique (event_id, guest_id, reminder_kind)
);

comment on table public.sent_reminders is 'Idempotency log for the Vercel cron reminder job. The unique constraint is the dedupe — cron may safely retry on transient failure.';


-- ============================================================================
-- 7. Trigger: keep events.updated_at fresh on every update
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 8. Enable RLS on every table
-- ============================================================================

alter table public.themes          enable row level security;
alter table public.effects         enable row level security;
alter table public.font_presets    enable row level security;
alter table public.events          enable row level security;
alter table public.event_cohosts   enable row level security;
alter table public.event_sections  enable row level security;
alter table public.guests          enable row level security;
alter table public.questions       enable row level security;
alter table public.answers         enable row level security;
alter table public.date_polls      enable row level security;
alter table public.date_options    enable row level security;
alter table public.date_votes      enable row level security;
alter table public.photos          enable row level security;
alter table public.event_messages  enable row level security;
alter table public.sent_reminders  enable row level security;


-- ============================================================================
-- 9. RLS policies
-- ============================================================================
-- Note: missing policies = denied. service_role bypasses RLS entirely, so
-- writes from `lib/supabase/service.ts` (catalog seeding, guest mutations,
-- cron) are unaffected by these.
-- ============================================================================

-- ----- Catalogs: world-readable, no writes from anon/authenticated ----------

create policy "themes_public_select"
  on public.themes for select
  to anon, authenticated
  using (true);

create policy "effects_public_select"
  on public.effects for select
  to anon, authenticated
  using (true);

create policy "font_presets_public_select"
  on public.font_presets for select
  to anon, authenticated
  using (true);


-- ----- events ---------------------------------------------------------------

-- Host can do anything to their own events.
create policy "events_owner_all"
  on public.events for all
  to authenticated
  using (host_id = (select auth.uid()))
  with check (host_id = (select auth.uid()));

-- Anyone (anon + authenticated) can read published events.
create policy "events_published_select"
  on public.events for select
  to anon, authenticated
  using (status = 'published');


-- ----- event_cohosts (P1, schema reserved) ---------------------------------

-- Until cohost UI ships, only the event's host can read/write the link rows.
create policy "event_cohosts_owner_all"
  on public.event_cohosts for all
  to authenticated
  using (
    event_id in (
      select id from public.events where host_id = (select auth.uid())
    )
  )
  with check (
    event_id in (
      select id from public.events where host_id = (select auth.uid())
    )
  );


-- ----- event_sections -------------------------------------------------------

create policy "event_sections_owner_all"
  on public.event_sections for all
  to authenticated
  using (
    event_id in (
      select id from public.events where host_id = (select auth.uid())
    )
  )
  with check (
    event_id in (
      select id from public.events where host_id = (select auth.uid())
    )
  );

-- Public can read sections of published events (rendered on the public page).
create policy "event_sections_published_select"
  on public.event_sections for select
  to anon, authenticated
  using (
    event_id in (
      select id from public.events where status = 'published'
    )
  );


-- ----- guests ---------------------------------------------------------------
-- Host has full control. Unauthenticated guest mutations (RSVP submission,
-- claim) go through Server Actions that verify the invite_token and use the
-- service-role client. RLS deny here is intentional.

create policy "guests_owner_all"
  on public.guests for all
  to authenticated
  using (
    event_id in (
      select id from public.events where host_id = (select auth.uid())
    )
  )
  with check (
    event_id in (
      select id from public.events where host_id = (select auth.uid())
    )
  );


-- ----- questions ------------------------------------------------------------

create policy "questions_owner_all"
  on public.questions for all
  to authenticated
  using (
    event_id in (
      select id from public.events where host_id = (select auth.uid())
    )
  )
  with check (
    event_id in (
      select id from public.events where host_id = (select auth.uid())
    )
  );

-- Guests need to see questions on the public event page to answer them.
create policy "questions_published_select"
  on public.questions for select
  to anon, authenticated
  using (
    event_id in (
      select id from public.events where status = 'published'
    )
  );


-- ----- answers --------------------------------------------------------------
-- Host can read all answers for their events. Guest writes go through
-- Server Actions + service-role after invite_token validation.

create policy "answers_host_select"
  on public.answers for select
  to authenticated
  using (
    guest_id in (
      select g.id
      from public.guests g
      join public.events e on e.id = g.event_id
      where e.host_id = (select auth.uid())
    )
  );


-- ----- date_polls / date_options -------------------------------------------

create policy "date_polls_owner_all"
  on public.date_polls for all
  to authenticated
  using (
    event_id in (
      select id from public.events where host_id = (select auth.uid())
    )
  )
  with check (
    event_id in (
      select id from public.events where host_id = (select auth.uid())
    )
  );

create policy "date_polls_published_select"
  on public.date_polls for select
  to anon, authenticated
  using (
    event_id in (
      select id from public.events where status = 'published'
    )
  );

create policy "date_options_owner_all"
  on public.date_options for all
  to authenticated
  using (
    poll_id in (
      select dp.id
      from public.date_polls dp
      join public.events e on e.id = dp.event_id
      where e.host_id = (select auth.uid())
    )
  )
  with check (
    poll_id in (
      select dp.id
      from public.date_polls dp
      join public.events e on e.id = dp.event_id
      where e.host_id = (select auth.uid())
    )
  );

create policy "date_options_published_select"
  on public.date_options for select
  to anon, authenticated
  using (
    poll_id in (
      select dp.id
      from public.date_polls dp
      join public.events e on e.id = dp.event_id
      where e.status = 'published'
    )
  );


-- ----- date_votes -----------------------------------------------------------
-- Host reads. Guest votes go through Server Actions + service-role.

create policy "date_votes_host_select"
  on public.date_votes for select
  to authenticated
  using (
    guest_id in (
      select g.id
      from public.guests g
      join public.events e on e.id = g.event_id
      where e.host_id = (select auth.uid())
    )
  );


-- ----- photos ---------------------------------------------------------------
-- Public read for published events. Host can delete. Anonymous guest uploads
-- go through Server Actions (rate-limited, signed URL — Prompt 20). A logged-
-- in user can also upload photos to a published event scoped to themselves.

create policy "photos_published_select"
  on public.photos for select
  to anon, authenticated
  using (
    event_id in (
      select id from public.events where status = 'published'
    )
  );

create policy "photos_owner_delete"
  on public.photos for delete
  to authenticated
  using (
    event_id in (
      select id from public.events where host_id = (select auth.uid())
    )
  );

create policy "photos_authenticated_self_insert"
  on public.photos for insert
  to authenticated
  with check (
    uploader_user_id = (select auth.uid())
    and event_id in (
      select id from public.events where status = 'published'
    )
  );


-- ----- event_messages -------------------------------------------------------
-- Host-only. No public read (these are notification copies, not feed items).

create policy "event_messages_owner_all"
  on public.event_messages for all
  to authenticated
  using (
    event_id in (
      select id from public.events where host_id = (select auth.uid())
    )
  )
  with check (
    event_id in (
      select id from public.events where host_id = (select auth.uid())
    )
  );


-- ----- sent_reminders -------------------------------------------------------
-- Cron writes via service-role (bypasses RLS). Host gets read access for any
-- "did this guest get the reminder?" UI we add later.

create policy "sent_reminders_host_select"
  on public.sent_reminders for select
  to authenticated
  using (
    event_id in (
      select id from public.events where host_id = (select auth.uid())
    )
  );


-- ============================================================================
-- 10. Indexes
-- ============================================================================
-- Postgres auto-indexes PKs and UNIQUE constraints, so the following are only
-- the additional ones we need for query patterns.

create index events_host_id_idx                  on public.events (host_id);
create index events_status_published_idx         on public.events (status) where status = 'published';
create index event_cohosts_user_id_idx           on public.event_cohosts (user_id);
create index event_sections_event_order_idx      on public.event_sections (event_id, order_index);
create index guests_event_id_idx                 on public.guests (event_id);
create index guests_claimed_user_id_idx          on public.guests (claimed_user_id) where claimed_user_id is not null;
create index questions_event_order_idx           on public.questions (event_id, order_index);
create index answers_guest_id_idx                on public.answers (guest_id);
create index date_polls_event_id_idx             on public.date_polls (event_id);
create index date_options_poll_id_idx            on public.date_options (poll_id);
create index date_votes_option_id_idx            on public.date_votes (option_id);
create index date_votes_guest_id_idx             on public.date_votes (guest_id);
create index photos_event_id_idx                 on public.photos (event_id);
create index photos_uploader_user_id_idx         on public.photos (uploader_user_id) where uploader_user_id is not null;
create index event_messages_event_id_idx         on public.event_messages (event_id);
