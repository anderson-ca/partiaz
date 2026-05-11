-- 09.85 — Co-host RLS + helper functions.
--
-- Two new helpers + a sweep of existing policies so anyone in
-- (host, co-host) has edit access where previously only the host did.
--
-- Schema reality vs the prompt:
--   • event_cohosts uses (event_id, user_id) as a composite PK — no
--     synthetic `id` column. Server actions key off the composite.
--   • `profiles` has no email column. Email → user_id lookup happens via
--     the SECURITY DEFINER `find_cohost_candidate` RPC, which scopes the
--     lookup to an event the caller hosts so it doesn't leak account
--     existence to the broader authenticated bucket.
--
-- DELETE on `events` stays restricted to the primary host (intentional):
-- co-hosts can edit everything else but not destroy.

-- ─── Helper #1: membership check ──────────────────────────────────────────

create or replace function public.is_event_host_or_cohost(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (select 1 from public.events where id = p_event_id and host_id = auth.uid())
    or exists (select 1 from public.event_cohosts where event_id = p_event_id and user_id = auth.uid());
$$;

revoke execute on function public.is_event_host_or_cohost(uuid) from public;
grant execute on function public.is_event_host_or_cohost(uuid) to authenticated;

-- ─── Helper #2: email-based candidate lookup ──────────────────────────────
--
-- Scoped to an event the caller hosts — that way we avoid exposing "does
-- this email have an account?" to every authenticated user. The function
-- returns the candidate's profile shape so the dialog can preview before
-- the host confirms add.

create or replace function public.find_cohost_candidate(p_event_id uuid, p_email text)
returns table (id uuid, display_name text, avatar_url text)
language sql
stable
security definer
set search_path = public, auth
as $$
  select p.id, p.display_name, p.avatar_url
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(u.email) = lower(trim(p_email))
    and exists (
      select 1 from public.events e
      where e.id = p_event_id and e.host_id = auth.uid()
    )
  limit 1;
$$;

revoke execute on function public.find_cohost_candidate(uuid, text) from public;
grant execute on function public.find_cohost_candidate(uuid, text) to authenticated;

-- ─── events: split FOR ALL into per-operation policies ────────────────────

drop policy if exists "events_owner_all" on public.events;

create policy "events_member_select"
  on public.events for select
  to authenticated
  using (host_id = (select auth.uid()) or public.is_event_host_or_cohost(id));

create policy "events_self_insert"
  on public.events for insert
  to authenticated
  with check (host_id = (select auth.uid()));

create policy "events_member_update"
  on public.events for update
  to authenticated
  using (host_id = (select auth.uid()) or public.is_event_host_or_cohost(id))
  with check (host_id = (select auth.uid()) or public.is_event_host_or_cohost(id));

create policy "events_host_delete"
  on public.events for delete
  to authenticated
  using (host_id = (select auth.uid()));

-- `events_published_select` (anon + authenticated published reads) is
-- untouched — additional FOR SELECT policies OR together.

-- ─── event_cohosts: per-operation policies ────────────────────────────────

drop policy if exists "event_cohosts_owner_all" on public.event_cohosts;

-- SELECT: editors of the event, the cohost themselves (visible on their
-- dashboard), or anyone who can see a published event (public page).
create policy "event_cohosts_select_visible"
  on public.event_cohosts for select
  to anon, authenticated
  using (
    public.is_event_host_or_cohost(event_id)
    or user_id = (select auth.uid())
    or event_id in (select id from public.events where status = 'published')
  );

-- INSERT: only the primary host adds cohosts.
create policy "event_cohosts_host_insert"
  on public.event_cohosts for insert
  to authenticated
  with check (
    exists (
      select 1 from public.events
      where id = event_id and host_id = (select auth.uid())
    )
  );

-- DELETE: primary host removes anyone; a cohost can remove themselves.
create policy "event_cohosts_host_or_self_delete"
  on public.event_cohosts for delete
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.events
      where id = event_id and host_id = (select auth.uid())
    )
  );

-- ─── child tables: widen host-only policies to host+cohost ────────────────
--
-- Each table's "owner_all" policy gets dropped and replaced with one that
-- delegates to is_event_host_or_cohost. The published-SELECT policies for
-- public-page consumption stay untouched.

drop policy if exists "event_sections_owner_all" on public.event_sections;
create policy "event_sections_member_all"
  on public.event_sections for all
  to authenticated
  using (public.is_event_host_or_cohost(event_id))
  with check (public.is_event_host_or_cohost(event_id));

drop policy if exists "guests_owner_all" on public.guests;
create policy "guests_member_all"
  on public.guests for all
  to authenticated
  using (public.is_event_host_or_cohost(event_id))
  with check (public.is_event_host_or_cohost(event_id));

drop policy if exists "questions_owner_all" on public.questions;
create policy "questions_member_all"
  on public.questions for all
  to authenticated
  using (public.is_event_host_or_cohost(event_id))
  with check (public.is_event_host_or_cohost(event_id));

drop policy if exists "answers_host_select" on public.answers;
create policy "answers_member_select"
  on public.answers for select
  to authenticated
  using (
    guest_id in (
      select g.id
      from public.guests g
      where public.is_event_host_or_cohost(g.event_id)
    )
  );

drop policy if exists "date_polls_owner_all" on public.date_polls;
create policy "date_polls_member_all"
  on public.date_polls for all
  to authenticated
  using (public.is_event_host_or_cohost(event_id))
  with check (public.is_event_host_or_cohost(event_id));

drop policy if exists "date_options_owner_all" on public.date_options;
create policy "date_options_member_all"
  on public.date_options for all
  to authenticated
  using (
    poll_id in (
      select dp.id
      from public.date_polls dp
      where public.is_event_host_or_cohost(dp.event_id)
    )
  )
  with check (
    poll_id in (
      select dp.id
      from public.date_polls dp
      where public.is_event_host_or_cohost(dp.event_id)
    )
  );

drop policy if exists "date_votes_host_select" on public.date_votes;
create policy "date_votes_member_select"
  on public.date_votes for select
  to authenticated
  using (
    guest_id in (
      select g.id
      from public.guests g
      where public.is_event_host_or_cohost(g.event_id)
    )
  );

drop policy if exists "photos_owner_delete" on public.photos;
create policy "photos_member_delete"
  on public.photos for delete
  to authenticated
  using (public.is_event_host_or_cohost(event_id));

drop policy if exists "event_messages_owner_all" on public.event_messages;
create policy "event_messages_member_all"
  on public.event_messages for all
  to authenticated
  using (public.is_event_host_or_cohost(event_id))
  with check (public.is_event_host_or_cohost(event_id));

drop policy if exists "sent_reminders_host_select" on public.sent_reminders;
create policy "sent_reminders_member_select"
  on public.sent_reminders for select
  to authenticated
  using (public.is_event_host_or_cohost(event_id));
