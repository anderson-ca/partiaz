-- 09.81 — Cover system rebuild.
--
-- Replaces the Prompt 07 hardcoded cover library with a real catalog table,
-- swaps the cover_image_source enum to ('illustration','gif','upload'), and
-- adds the four cover-overlay fields used by the editor + public page.
--
-- The library tab renders empty after this migration applies — content
-- seeding is the next migration / prompt (cover library seed). Architecture
-- only here.

-- ─── New illustration library table ───────────────────────────────────────

create table cover_illustrations (
  id            uuid primary key default gen_random_uuid(),
  image_url     text not null,
  category      text not null
    check (category in ('wedding','birthday','ramadan','christmas','halloween','other')),
  display_order int  not null default 0,
  created_at    timestamptz not null default now()
);

create index cover_illustrations_category_idx
  on cover_illustrations (category);

create index cover_illustrations_display_order_idx
  on cover_illustrations (display_order);

-- Public read; writes only via service-role (admin / seed migrations).
alter table cover_illustrations enable row level security;

create policy "cover_illustrations readable by anyone"
  on cover_illustrations
  for select
  using (true);

-- ─── Migrate pre-existing source values ────────────────────────────────────
-- Prompt 07 used 'library' for hardcoded covers. Rename to 'illustration' so
-- the new enum can ditch 'library' entirely. (No 'unsplash' values exist in
-- the wild — that branch was reserved by the original schema but never
-- written to.)
update events set cover_image_source = 'illustration' where cover_image_source = 'library';

-- ─── Swap the check constraint ─────────────────────────────────────────────
-- Drop+recreate is the safe pattern; an in-place rewrite isn't possible.
-- Both this DROP and ADD run in the same transaction so the table is never
-- without a constraint.
alter table events drop constraint if exists events_cover_image_source_check;

alter table events add constraint events_cover_image_source_check
  check (
    cover_image_source is null
    or cover_image_source in ('illustration','gif','upload')
  );

-- ─── Overlay text fields ───────────────────────────────────────────────────

alter table events
  add column cover_overlay_enabled  boolean not null default false,
  add column cover_overlay_text     text,
  add column cover_overlay_font_id  uuid references font_presets(id) on delete set null,
  add column cover_overlay_color    text;
