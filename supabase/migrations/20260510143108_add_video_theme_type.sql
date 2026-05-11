-- 09.83 — Add 'video' as a fifth themes.background_type.
--
-- Storage shape (jsonb), to keep the existing renderer dispatcher pattern:
--   { "type":"video", "src":"https://…/videos/pexels-XXX.mp4",
--                     "poster":"https://…/posters/pexels-XXX.jpg" }
--
-- The poster is the static frame extracted by scripts/process-theme-videos.ts.
-- It's used as <video poster="…">, the picker-grid thumbnail, the dashboard
-- card background, and the prefers-reduced-motion fallback. No column shape
-- changes — the existing jsonb column already accepts arbitrary discriminated
-- payloads.

alter table themes drop constraint if exists themes_background_type_check;

alter table themes add constraint themes_background_type_check
  check (background_type in ('gradient','unsplash','pattern','solid','video'));
