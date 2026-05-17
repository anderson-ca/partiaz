-- 12a — Host-controlled plus-one settings + RSVP edit policy.
--
-- Adds four host-side knobs to `events`:
--   • plus_one_enabled       — master toggle, default OFF
--   • plus_one_max_adults    — per-guest adult cap, 0..5, default 1
--   • plus_one_max_children  — per-guest child cap, 0..5, default 0
--   • allow_rsvp_edit        — can guests edit their RSVP after submitting?
--                              default ON
--
-- The 0..5 ceilings are belt-and-suspenders: the UI clamps the host's
-- input, but the DB constraint prevents corruption from any future write
-- path (admin tools, scripts, direct SQL). Guest-side enforcement that
-- `plus_one_adults <= event.plus_one_max_adults` is the [12b] submission
-- action's job — not worth a DB trigger.
--
-- Replaces `guests.plus_one_count` (single int) with two split columns:
-- `plus_one_adults` and `plus_one_children`. Pre-launch, no real user
-- data on the column yet → drop is safe (verified: zero app-code reads).

alter table public.events
  add column plus_one_enabled boolean not null default false,
  add column plus_one_max_adults int not null default 1
    check (plus_one_max_adults >= 0 and plus_one_max_adults <= 5),
  add column plus_one_max_children int not null default 0
    check (plus_one_max_children >= 0 and plus_one_max_children <= 5),
  add column allow_rsvp_edit boolean not null default true;

alter table public.guests
  add column plus_one_adults int not null default 0
    check (plus_one_adults >= 0),
  add column plus_one_children int not null default 0
    check (plus_one_children >= 0),
  drop column plus_one_count;
