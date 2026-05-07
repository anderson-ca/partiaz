-- ============================================================================
-- RLS smoke tests — manual checklist
-- ============================================================================
-- This file is documentation, not an automated test runner. Run these by
-- hand in the Supabase SQL editor (or via curl with the anon publishable key)
-- after any policy change. Pair with the table:
--   migrations/<timestamp>_core_schema.sql  (initial policy set)
--
-- The Supabase SQL editor runs as service_role, which bypasses RLS. To test
-- RLS as a real role, EITHER:
--   (a) Use SET LOCAL role <anon|authenticated> + SET LOCAL "request.jwt.claims"
--       inside the SQL editor, then run the query, then ROLLBACK.
--   (b) Use the REST API (PostgREST) with the publishable key (anon role).
--   (c) For a logged-in user: copy a real session JWT from the browser, then
--       hit /rest/v1/<table> with `Authorization: Bearer <jwt>`.
--
-- The shell snippets below assume:
--   URL=$NEXT_PUBLIC_SUPABASE_URL
--   KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
-- ============================================================================


-- 1. Catalogs are world-readable
-- Expect: HTTP 200 + array (empty until prompt 04 seeds the catalog).
--   curl "$URL/rest/v1/themes?select=id&limit=1"        -H "apikey: $KEY"
--   curl "$URL/rest/v1/effects?select=id&limit=1"       -H "apikey: $KEY"
--   curl "$URL/rest/v1/font_presets?select=id&limit=1"  -H "apikey: $KEY"


-- 2. Catalog writes are denied for anon
-- Expect: 401 + 'violates row-level security policy'.
--   curl -X POST "$URL/rest/v1/themes" -H "apikey: $KEY" -H "Content-Type: application/json" \
--     -d '{"name":"x","category":"dark","background_type":"solid","background_value":{},"recommended_text_color":"#fff"}'


-- 3. events: anon sees only published rows
-- Setup (run as service_role in SQL editor — needs catalog rows from prompt 04):
--   insert into public.events (slug, host_id, theme_id, font_preset_id, status)
--   values ('draft1', '<your auth uid>', '<theme uuid>', '<font uuid>', 'draft'),
--          ('pub1',   '<your auth uid>', '<theme uuid>', '<font uuid>', 'published');
--
-- Expect:
--   GET /rest/v1/events as anon → only 'pub1'
--   GET /rest/v1/events as the host (authenticated, host_id matches) → both
--   GET /rest/v1/events as a different authenticated user → only 'pub1'


-- 4. events: anon cannot insert
-- Expect: 401 + 'violates row-level security policy'.
--   curl -X POST "$URL/rest/v1/events" -H "apikey: $KEY" -H "Content-Type: application/json" \
--     -d '{"slug":"smoke","host_id":"00000000-0000-0000-0000-000000000000","theme_id":"00000000-0000-0000-0000-000000000000","font_preset_id":"00000000-0000-0000-0000-000000000000"}'


-- 5. events: authenticated user cannot create event impersonating another host
-- Setup: copy a real session JWT for user A. Try to insert with host_id = user B.
-- Expect: 401 with_check violation (events_owner_all `with check` requires host_id = auth.uid()).


-- 6. guests: anon sees zero rows even when there are guests
-- Setup: insert a guest row as service_role.
--   GET /rest/v1/guests?select=id  with anon key → []
-- Expect: empty array (no anon SELECT policy).


-- 7. guests: host sees only their own guests
-- Setup: two events, two hosts, each with one guest row.
-- Expect: each host's session JWT only sees their own guest.


-- 8. answers / date_votes / sent_reminders: anon sees nothing
-- Verify the same way: GET via REST as anon → [].


-- 9. event_sections / questions / date_polls / date_options / photos:
-- public read works for published events but blocked for drafts
--   GET /rest/v1/event_sections?event_id=eq.<draft_id>      → []
--   GET /rest/v1/event_sections?event_id=eq.<published_id>  → rows


-- 10. RLS is enabled on every table
-- Run this as service_role; expect 0 rows.
select tablename
from pg_tables
where schemaname = 'public'
  and rowsecurity = false;
