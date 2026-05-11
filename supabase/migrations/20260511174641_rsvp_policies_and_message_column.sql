-- 10 — Real RSVP flow.
--
-- Schema reality vs the prompt:
--   • `rsvp` column (NOT `rsvp_status`)
--   • `claimed_user_id` column (NOT `profile_id`) — the FK into profiles
--   • `responded_at` (NOT `updated_at`) — bumped on each RSVP change
--   • `host_notes text` is private-to-host. The prompt's `message` field is
--     for the GUEST's note to the host, which doesn't exist yet. Add it as
--     `guest_message text`.
--
-- Constraints:
--   • `invite_token` is already globally UNIQUE (Prompt 03 baseline), which
--     is even stricter than per-event uniqueness. Keep as-is — 24-char
--     nanoid collisions are vanishingly rare and a global unique simplifies
--     anon-by-token lookups.
--   • New partial unique on `(event_id, claimed_user_id) WHERE
--     claimed_user_id IS NOT NULL` prevents a logged-in user from having
--     two RSVP rows for the same event. Anonymous (claimed_user_id NULL)
--     guests can multi-row by design (each cookieless visit is a new guest).

alter table public.guests
  add column guest_message text;

create unique index guests_event_claimed_user_unique
  on public.guests (event_id, claimed_user_id)
  where claimed_user_id is not null;

-- ─── RLS: per-operation policies ──────────────────────────────────────────
--
-- Anonymous (anon) gets NO direct DB access. All anon mutations go through
-- Server Actions using the service-role client AFTER token validation. We
-- only define policies for the `authenticated` role.

drop policy if exists "guests_member_all" on public.guests;

-- SELECT: see your own RSVPs, OR see all RSVPs on events you host/cohost.
create policy "guests_self_or_host_select"
  on public.guests for select
  to authenticated
  using (
    claimed_user_id = (select auth.uid())
    or public.is_event_host_or_cohost(event_id)
  );

-- INSERT: only ever insert your own RSVP. The action enforces that
-- `claimed_user_id` equals the caller's uid; this WITH CHECK is the
-- belt-and-suspenders.
create policy "guests_self_insert"
  on public.guests for insert
  to authenticated
  with check (claimed_user_id = (select auth.uid()));

-- UPDATE: only your own RSVP row. Hosts/cohosts DON'T edit guests' RSVPs
-- (intentional — they can remove but not impersonate).
create policy "guests_self_update"
  on public.guests for update
  to authenticated
  using (claimed_user_id = (select auth.uid()))
  with check (claimed_user_id = (select auth.uid()));

-- DELETE: hosts/cohosts can remove anyone from their guest list. A guest
-- can also remove themselves (e.g. "actually I can't make it, take me off
-- the list" — UX TBD but the policy permits it).
create policy "guests_host_or_self_delete"
  on public.guests for delete
  to authenticated
  using (
    claimed_user_id = (select auth.uid())
    or public.is_event_host_or_cohost(event_id)
  );
