-- [ui-6a] FontPicker catalog expansion — 17 new presets + order_index column
--
-- Adds an explicit ordering axis (mirrors the `effects.order_index` pattern
-- the codebase already relies on) so new presets can append after existing
-- ones in their DB category without re-sorting by name. Without this, new
-- entries would interleave alphabetically with existing ones and shift the
-- picker layout for existing hosts who already know where their fonts live.
--
-- All 17 new presets are Cyrillic-verified (Google Fonts subsets include
-- `cyrillic`) so the AZ market — and RU diaspora — sees real glyphs, not
-- missing-glyph rectangles.
--
-- New SERIF presets (EB Garamond, Source Serif 4, Spectral, Crimson Pro)
-- map to the `literary` DB category — text/body serifs as a group — while
-- the existing `elegant` (Lora, Playfair Display) keeps the higher-contrast
-- display-serif personality. UI buckets both into a single SERIF group at
-- render.

begin;

-- ─── Schema: add order_index ───────────────────────────────────────────
alter table public.font_presets
  add column if not exists order_index int not null default 0;

-- ─── Existing 10 rows — explicit alphabetical-within-category baseline ─
-- Preserves the picker order hosts already know. 100-unit gap before new
-- entries below leaves room for future inserts in either direction.
update public.font_presets set order_index = 10 where font_family = 'IBM Plex Sans';
update public.font_presets set order_index = 20 where font_family = 'Inter';
update public.font_presets set order_index = 10 where font_family = 'JetBrains Mono';
update public.font_presets set order_index = 10 where font_family = 'Caveat';
update public.font_presets set order_index = 20 where font_family = 'Pacifico';
update public.font_presets set order_index = 10 where font_family = 'Lora';
update public.font_presets set order_index = 20 where font_family = 'Playfair Display';
update public.font_presets set order_index = 10 where font_family = 'Yeseva One';
update public.font_presets set order_index = 10 where font_family = 'Cormorant Garamond';
update public.font_presets set order_index = 20 where font_family = 'PT Serif';

-- ─── 17 new presets ────────────────────────────────────────────────────
-- Per-category weight conventions (mirroring existing dominant weight in
-- the category): SANS 500, literary-SERIF 500, DISPLAY 400, HANDWRITTEN 400,
-- MONO 500. letter_spacing 'normal', text_transform 'none' for all. The
-- existing outliers (PT Serif 400, Caveat 600) stay as-is per scope.
insert into public.font_presets
  (category, name, font_family, font_weight, letter_spacing, text_transform, supports_az, supports_ru, order_index)
values
  -- SANS (classic) — order 110..150. Rubik + Nunito substituted for the
  -- originally-proposed Space Grotesk + DM Sans (failed next/font Cyrillic
  -- type check); slot ordering preserved.
  ('classic',  'Rubik',            'Rubik',            500, 'normal', 'none', true, true, 110),
  ('classic',  'Nunito',           'Nunito',           500, 'normal', 'none', true, true, 120),
  ('classic',  'Manrope',          'Manrope',          500, 'normal', 'none', true, true, 130),
  ('classic',  'Onest',            'Onest',            500, 'normal', 'none', true, true, 140),
  ('classic',  'Mulish',           'Mulish',           500, 'normal', 'none', true, true, 150),
  -- SERIF (literary) — order 110..130; existing 'elegant' Lora+Playfair stay
  -- where they are. Merriweather substituted for Spectral (Cyrillic gap).
  -- Crimson Pro originally planned for slot 140; dropped — next/font/google
  -- types don't expose Cyrillic for it. Bucket lands at 3 new entries.
  ('literary', 'EB Garamond',      'EB Garamond',      500, 'normal', 'none', true, true, 110),
  ('literary', 'Source Serif 4',   'Source Serif 4',   500, 'normal', 'none', true, true, 120),
  ('literary', 'Merriweather',     'Merriweather',     500, 'normal', 'none', true, true, 130),
  -- DISPLAY (fancy) — order 110..130. Bodoni Moda dropped (no Cyrillic
  -- substitute found); Lobster added in its compacted slot — visually a
  -- bold retro display script, not personal handwriting.
  ('fancy',    'Forum',            'Forum',            400, 'normal', 'none', true, true, 110),
  ('fancy',    'Tenor Sans',       'Tenor Sans',       400, 'normal', 'none', true, true, 120),
  ('fancy',    'Lobster',          'Lobster',          400, 'normal', 'none', true, true, 130),
  -- HANDWRITTEN (eclectic) — order 110..120. Dancing Script removed (Cyrillic
  -- gap); its substitute Lobster moved to DISPLAY per its visual personality.
  -- Slots compacted so the bucket starts at 110.
  ('eclectic', 'Marck Script',     'Marck Script',     400, 'normal', 'none', true, true, 110),
  ('eclectic', 'Bad Script',       'Bad Script',       400, 'normal', 'none', true, true, 120),
  -- MONO (digital) — order 110..120
  ('digital',  'IBM Plex Mono',    'IBM Plex Mono',    500, 'normal', 'none', true, true, 110),
  ('digital',  'Roboto Mono',      'Roboto Mono',      500, 'normal', 'none', true, true, 120)
on conflict (font_family, font_weight) do nothing;

commit;
