-- [bug-fix-3] — get_event_member_contacts RPC for self/host/cohost guard
-- rail in app/actions/guests.ts (addGuest + addGuestsBatch).
--
-- Why an RPC at all: `profiles` has no email column ([06.x] schema
-- realities — email lookups historically routed through the existing
-- `find_cohost_candidate` SECURITY DEFINER RPC for the same reason).
-- The guards need both email (for the dominant invite channel) and
-- phone, and the canonical source for member email is `auth.users` —
-- which authenticated users can't read directly. This RPC bridges that
-- gap with a scoped, definer-privileged lookup.
--
-- Security model — mirrors `find_cohost_candidate` exactly:
--   • security definer + explicit `set search_path = public, auth` so
--     the function's body resolves table refs deterministically and
--     can't be subverted by a malicious search_path.
--   • Caller scope: returns rows ONLY when auth.uid() is host or
--     cohost of the requested event. Without that guard the function
--     would be an open contact-leak endpoint for any authenticated
--     user with a guessable event id.
--   • Execute revoked from public, granted to authenticated.

create or replace function public.get_event_member_contacts(p_event_id uuid)
returns table (email text, phone text)
language sql
stable
security definer
set search_path = public, auth
as $$
  select u.email, u.phone
  from auth.users u
  where u.id in (
    select e.host_id from public.events e where e.id = p_event_id
    union
    select ec.user_id from public.event_cohosts ec where ec.event_id = p_event_id
  )
  and exists (
    select 1 from public.events e2
    where e2.id = p_event_id
      and (
        e2.host_id = auth.uid()
        or exists (
          select 1 from public.event_cohosts ec2
          where ec2.event_id = p_event_id and ec2.user_id = auth.uid()
        )
      )
  );
$$;

revoke execute on function public.get_event_member_contacts(uuid) from public;
grant execute on function public.get_event_member_contacts(uuid) to authenticated;
