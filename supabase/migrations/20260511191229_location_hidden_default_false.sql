-- 10.1 — Flip `events.location_hidden_until_rsvp` default to false + backfill.
--
-- Prompt 03 schema set this column to `default true`, but the location-
-- gating UI never landed until [10.1]. So every existing event has
-- `location_hidden_until_rsvp = true` despite locations being publicly
-- visible across the entire user-facing history. Turning the gate on now
-- without backfilling would silently re-hide locations on events that have
-- already been shared with guests — a behavior change nobody asked for.
--
-- Fix: set the new default to false and backfill all currently-true rows
-- to false. Hosts who actually want location-hiding flip it on per-event
-- via the new Event Settings panel. Going forward, the column matches the
-- visible-default UX (most events advertise their location).
--
-- The four sibling columns (show_guest_count, show_guest_names,
-- allow_maybe, require_names) already default to `true`, which matches
-- the desired UX. No backfill needed for those.

alter table events alter column location_hidden_until_rsvp set default false;

update events set location_hidden_until_rsvp = false where location_hidden_until_rsvp = true;
