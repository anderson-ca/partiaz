-- ============================================================================
-- event-covers Storage bucket + RLS policies
-- ============================================================================
-- Public-read bucket for hero/cover images on event pages. Path convention:
--   {auth.uid()}/{uuid}.{ext}
-- The first folder segment is the uploader's user id, which lets RLS enforce
-- ownership purely from the path — no extra DB lookup needed.
-- ============================================================================

-- Public read bucket. file_size_limit is in bytes (5 MiB).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-covers',
  'event-covers',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;


-- Anyone (anon + authenticated) can read — covers are rendered on public
-- event pages.
create policy "event_covers_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'event-covers');


-- Authenticated users can upload only into a folder named with their own
-- auth.uid(). storage.foldername(name) returns the path's folder segments;
-- [1] is the top-level folder.
create policy "event_covers_authenticated_upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'event-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- Owners can overwrite their own uploads. Required for upsert; harmless for
-- the no-upsert case.
create policy "event_covers_owner_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'event-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'event-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- Owners can delete their own uploads. Used by Prompt 08's event lifecycle
-- (when a user replaces a cover or deletes an event, we clean up the file).
create policy "event_covers_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'event-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
