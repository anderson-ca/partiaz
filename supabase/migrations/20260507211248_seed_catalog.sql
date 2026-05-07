-- ============================================================================
-- Seed catalog: themes, effects, font_presets
-- ============================================================================
-- Idempotent: every insert is paired with `on conflict do nothing` against a
-- natural-key constraint. Re-running the migration in a shadow DB is safe.
-- For natural keys: themes use (category, name); effects use (name); fonts
-- use (font_family, font_weight). Unique indexes are added below before the
-- inserts so the conflict targets resolve.
-- ============================================================================


-- ----- Idempotency unique indexes ------------------------------------------

create unique index if not exists themes_category_name_uq
  on public.themes (category, name);

create unique index if not exists effects_name_uq
  on public.effects (name);

create unique index if not exists font_presets_family_weight_uq
  on public.font_presets (font_family, font_weight);


-- ============================================================================
-- 1. Themes
-- ============================================================================
-- Distribution (per PRODUCT_SPEC.md §8.3):
--   12 gradients, 10 unsplash photos, 6 patterns, 2 solids = 30 rows
-- This file ships 12 + N + 6 + 2 = (20 + N) rows where N is the count of
-- Unsplash IDs sourced under the "abstract / no people / no objects /
-- no landmarks" filter (see CLAUDE.md memory). The remaining (10 - N) rows
-- get added in a follow-up migration once the cover-image picker integration
-- (Prompt 07) lands a verified API path.
-- ============================================================================


-- ----- Gradients (12) -------------------------------------------------------

insert into public.themes (name, category, background_type, background_value, recommended_text_color, order_index)
values
  ('Sunset',         'trending', 'gradient',
    '{"type":"gradient","css":"radial-gradient(at 30% 20%, #ff6b9d 0%, #f59e0b 50%, #5b8def 100%)"}',
    '#ffffff', 1),
  ('Midnight',       'dark',     'gradient',
    '{"type":"gradient","css":"linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #4c1d95 100%)"}',
    '#ffffff', 2),
  ('Aurora',         'trending', 'gradient',
    '{"type":"gradient","css":"linear-gradient(135deg, #0f3a5b 0%, #29c489 50%, #b1f3ff 100%)"}',
    '#ffffff', 3),
  ('Cotton Candy',   'fun',      'gradient',
    '{"type":"gradient","css":"linear-gradient(135deg, #ffd1ec 0%, #c9b6ff 50%, #a0e4ff 100%)"}',
    '#1a1a2e', 4),
  ('Ember',          'fun',      'gradient',
    '{"type":"gradient","css":"radial-gradient(at 70% 80%, #ff3d3d 0%, #ff8a00 40%, #1a0f0a 100%)"}',
    '#ffffff', 5),
  ('Mint Air',       'light',    'gradient',
    '{"type":"gradient","css":"linear-gradient(140deg, #e6fff5 0%, #b8f1e0 50%, #80d0c7 100%)"}',
    '#0a3d3a', 6),
  ('Lavender Mist',  'light',    'gradient',
    '{"type":"gradient","css":"linear-gradient(135deg, #f5f0ff 0%, #d6c8f2 60%, #a890e0 100%)"}',
    '#2c1f4a', 7),
  ('Ocean Deep',     'dark',     'gradient',
    '{"type":"gradient","css":"radial-gradient(at 20% 80%, #0a2e4a 0%, #0a1929 60%, #050d18 100%)"}',
    '#ffffff', 8),
  ('Peach Cream',    'light',    'gradient',
    '{"type":"gradient","css":"linear-gradient(160deg, #ffe8d6 0%, #ffc09f 50%, #ff8c69 100%)"}',
    '#3d1f10', 9),
  ('Cosmic',         'trending', 'gradient',
    '{"type":"gradient","css":"conic-gradient(from 220deg at 50% 50%, #4c1d95, #db2777, #f59e0b, #4c1d95)"}',
    '#ffffff', 10),
  ('Spring Bloom',   'seasonal', 'gradient',
    '{"type":"gradient","css":"linear-gradient(135deg, #ffd6e8 0%, #b5e8c5 50%, #fff4b8 100%)"}',
    '#3d1f3a', 11),
  ('Winter Frost',   'seasonal', 'gradient',
    '{"type":"gradient","css":"linear-gradient(135deg, #d4e6f1 0%, #aab8d2 50%, #6c7a99 100%)"}',
    '#1a2438', 12)
on conflict (category, name) do nothing;


-- ----- Solid colors (2) -----------------------------------------------------

insert into public.themes (name, category, background_type, background_value, recommended_text_color, order_index)
values
  ('Off-White',  'light', 'solid', '{"type":"solid","color":"#fafafa"}', '#1a1a2e', 13),
  ('Deep Plum',  'dark',  'solid', '{"type":"solid","color":"#1a1124"}', '#fafafa', 14)
on conflict (category, name) do nothing;


-- ----- SVG patterns (6) -----------------------------------------------------
-- Files live in public/patterns/<name>.svg. They use currentColor + low
-- opacity so the renderer can tint via the parent's color: rule. Tile size
-- is encoded in each SVG's viewBox; CSS sets background-repeat: repeat.

insert into public.themes (name, category, background_type, background_value, recommended_text_color, order_index)
values
  ('Dots',       'light', 'pattern',
    '{"type":"pattern","svg_url":"/patterns/dots.svg","background_color":"#fafafa","scale":1.0}',
    '#1a1a2e', 15),
  ('Lines',      'light', 'pattern',
    '{"type":"pattern","svg_url":"/patterns/lines.svg","background_color":"#fff4e6","scale":1.0}',
    '#3d1f10', 16),
  ('Waves',      'light', 'pattern',
    '{"type":"pattern","svg_url":"/patterns/waves.svg","background_color":"#e8f4fd","scale":1.0}',
    '#0a2e4a', 17),
  ('Hexagons',   'dark',  'pattern',
    '{"type":"pattern","svg_url":"/patterns/hexagons.svg","background_color":"#1a1a2e","scale":1.0}',
    '#fafafa', 18),
  ('Plus Signs', 'fun',   'pattern',
    '{"type":"pattern","svg_url":"/patterns/plus-signs.svg","background_color":"#fff5d1","scale":1.0}',
    '#3d2f10', 19),
  ('Grid',       'dark',  'pattern',
    '{"type":"pattern","svg_url":"/patterns/grid.svg","background_color":"#0f172a","scale":1.0}',
    '#fafafa', 20)
on conflict (category, name) do nothing;


-- ----- Unsplash photos (46) -------------------------------------------------
-- IDs sourced and curated by the user from unsplash.com (no API). Stored
-- here as the 11-char API photo_id; Prompt 07 (cover image picker) will
-- resolve to real CDN URLs via the Unsplash API. Until then the renderer
-- in Prompt 05 may need to fall back to the API for the actual image bytes
-- — the URL below uses the conventional `images.unsplash.com/photo-{id}`
-- shorthand specified in the prompt.
--
-- Photo IDs are 11 chars of [A-Za-z0-9_-]. Some have leading dashes
-- (-xWyFtHExC8), some have internal dashes (o-fmysR2y7Y), some have
-- underscores (Q_RBVFFXR_g). All preserved verbatim.

insert into public.themes (name, category, background_type, background_value, recommended_text_color, order_index)
values
  ('Confetti',          'fun',      'unsplash', '{"type":"unsplash","photo_id":"Xaanw0s0pMk","url":"https://images.unsplash.com/photo-Xaanw0s0pMk?w=1600&q=80","overlay_css":"linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.15))"}', '#ffffff', 21),
  ('Pink Sky',          'light',    'unsplash', '{"type":"unsplash","photo_id":"qjCHPZbeXCQ","url":"https://images.unsplash.com/photo-qjCHPZbeXCQ?w=1600&q=80","overlay_css":"linear-gradient(rgba(255,255,255,0.25), rgba(255,255,255,0.05))"}', '#1a1a1a', 22),
  ('Bloom',             'seasonal', 'unsplash', '{"type":"unsplash","photo_id":"cxE7SXKnzv0","url":"https://images.unsplash.com/photo-cxE7SXKnzv0?w=1600&q=80","overlay_css":"linear-gradient(rgba(255,255,255,0.25), rgba(255,255,255,0.05))"}', '#1a1a1a', 23),
  ('Pastel Sky',        'light',    'unsplash', '{"type":"unsplash","photo_id":"GLf7bAwCdYg","url":"https://images.unsplash.com/photo-GLf7bAwCdYg?w=1600&q=80","overlay_css":"linear-gradient(rgba(255,255,255,0.25), rgba(255,255,255,0.05))"}', '#1a1a1a', 24),
  ('Pink Noir',         'trending', 'unsplash', '{"type":"unsplash","photo_id":"9XngoIpxcEo","url":"https://images.unsplash.com/photo-9XngoIpxcEo?w=1600&q=80","overlay_css":"linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.15))"}', '#ffffff', 25),
  ('Mountain Stars',    'dark',     'unsplash', '{"type":"unsplash","photo_id":"4dpAqfTbvKA","url":"https://images.unsplash.com/photo-4dpAqfTbvKA?w=1600&q=80","overlay_css":"linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.15))"}', '#ffffff', 26),
  ('Pink Blur',         'trending', 'unsplash', '{"type":"unsplash","photo_id":"XgeZu2jBaVI","url":"https://images.unsplash.com/photo-XgeZu2jBaVI?w=1600&q=80","overlay_css":"linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.15))"}', '#ffffff', 27),
  ('Blue Sky',          'light',    'unsplash', '{"type":"unsplash","photo_id":"KAgGjw4HgNY","url":"https://images.unsplash.com/photo-KAgGjw4HgNY?w=1600&q=80","overlay_css":"linear-gradient(rgba(255,255,255,0.25), rgba(255,255,255,0.05))"}', '#1a1a1a', 28),
  ('Balloons',          'fun',      'unsplash', '{"type":"unsplash","photo_id":"DuBNA1QMpPA","url":"https://images.unsplash.com/photo-DuBNA1QMpPA?w=1600&q=80","overlay_css":"linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.15))"}', '#ffffff', 29),
  ('Neon Light',        'trending', 'unsplash', '{"type":"unsplash","photo_id":"LeG68PrXA6Y","url":"https://images.unsplash.com/photo-LeG68PrXA6Y?w=1600&q=80","overlay_css":"linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.15))"}', '#ffffff', 30),
  ('Soft Brushwork',    'light',    'unsplash', '{"type":"unsplash","photo_id":"QRghuf5yTA4","url":"https://images.unsplash.com/photo-QRghuf5yTA4?w=1600&q=80","overlay_css":"linear-gradient(rgba(255,255,255,0.25), rgba(255,255,255,0.05))"}', '#1a1a1a', 31),
  ('Sandstone',         'trending', 'unsplash', '{"type":"unsplash","photo_id":"gREi-9tI5Mg","url":"https://images.unsplash.com/photo-gREi-9tI5Mg?w=1600&q=80","overlay_css":"linear-gradient(rgba(255,255,255,0.25), rgba(255,255,255,0.05))"}', '#1a1a1a', 32),
  ('Yellow Dots',       'fun',      'unsplash', '{"type":"unsplash","photo_id":"S8bde3hkBR8","url":"https://images.unsplash.com/photo-S8bde3hkBR8?w=1600&q=80","overlay_css":"linear-gradient(rgba(255,255,255,0.25), rgba(255,255,255,0.05))"}', '#1a1a1a', 33),
  ('Painted Brick',     'trending', 'unsplash', '{"type":"unsplash","photo_id":"KvTOwKoji7g","url":"https://images.unsplash.com/photo-KvTOwKoji7g?w=1600&q=80","overlay_css":"linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.15))"}', '#ffffff', 34),
  ('Sea Glass',         'trending', 'unsplash', '{"type":"unsplash","photo_id":"oAGL8j9GKLc","url":"https://images.unsplash.com/photo-oAGL8j9GKLc?w=1600&q=80","overlay_css":"linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.15))"}', '#ffffff', 35),
  ('Color Smoke',       'trending', 'unsplash', '{"type":"unsplash","photo_id":"3k9PGKWt7ik","url":"https://images.unsplash.com/photo-3k9PGKWt7ik?w=1600&q=80","overlay_css":"linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.15))"}', '#ffffff', 36),
  ('Faded Lights',      'trending', 'unsplash', '{"type":"unsplash","photo_id":"Lll4QeybDEg","url":"https://images.unsplash.com/photo-Lll4QeybDEg?w=1600&q=80","overlay_css":"linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.15))"}', '#ffffff', 37),
  ('Color Wash',        'trending', 'unsplash', '{"type":"unsplash","photo_id":"YXQew2KZjzY","url":"https://images.unsplash.com/photo-YXQew2KZjzY?w=1600&q=80","overlay_css":"linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.15))"}', '#ffffff', 38),
  ('Pink Glitter',      'fun',      'unsplash', '{"type":"unsplash","photo_id":"Uvl3W4XWd4U","url":"https://images.unsplash.com/photo-Uvl3W4XWd4U?w=1600&q=80","overlay_css":"linear-gradient(rgba(255,255,255,0.25), rgba(255,255,255,0.05))"}', '#1a1a1a', 39),
  ('Blue Brushwork',    'light',    'unsplash', '{"type":"unsplash","photo_id":"r2F5ZIEUPtk","url":"https://images.unsplash.com/photo-r2F5ZIEUPtk?w=1600&q=80","overlay_css":"linear-gradient(rgba(255,255,255,0.25), rgba(255,255,255,0.05))"}', '#1a1a1a', 40),
  ('Cloud Sea',         'light',    'unsplash', '{"type":"unsplash","photo_id":"LtWFFVi1RXQ","url":"https://images.unsplash.com/photo-LtWFFVi1RXQ?w=1600&q=80","overlay_css":"linear-gradient(rgba(255,255,255,0.25), rgba(255,255,255,0.05))"}', '#1a1a1a', 41),
  ('Night Plane',       'dark',     'unsplash', '{"type":"unsplash","photo_id":"VdFkSO3uePI","url":"https://images.unsplash.com/photo-VdFkSO3uePI?w=1600&q=80","overlay_css":"linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.15))"}', '#ffffff', 42),
  ('Starry Sky',        'dark',     'unsplash', '{"type":"unsplash","photo_id":"SshYpuf607g","url":"https://images.unsplash.com/photo-SshYpuf607g?w=1600&q=80","overlay_css":"linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.15))"}', '#ffffff', 43),
  ('Soft Blur',         'trending', 'unsplash', '{"type":"unsplash","photo_id":"87PP9Zd7MNo","url":"https://images.unsplash.com/photo-87PP9Zd7MNo?w=1600&q=80","overlay_css":"linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.15))"}', '#ffffff', 44),
  ('Silhouette',        'dark',     'unsplash', '{"type":"unsplash","photo_id":"h8nxGssjQXs","url":"https://images.unsplash.com/photo-h8nxGssjQXs?w=1600&q=80","overlay_css":"linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.15))"}', '#ffffff', 45),
  ('Galaxy',            'dark',     'unsplash', '{"type":"unsplash","photo_id":"o-fmysR2y7Y","url":"https://images.unsplash.com/photo-o-fmysR2y7Y?w=1600&q=80","overlay_css":"linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.15))"}', '#ffffff', 46),
  ('Cloud Painting',    'light',    'unsplash', '{"type":"unsplash","photo_id":"kOajnscQxW8","url":"https://images.unsplash.com/photo-kOajnscQxW8?w=1600&q=80","overlay_css":"linear-gradient(rgba(255,255,255,0.25), rgba(255,255,255,0.05))"}', '#1a1a1a', 47),
  ('Stars Field',       'dark',     'unsplash', '{"type":"unsplash","photo_id":"Q_RBVFFXR_g","url":"https://images.unsplash.com/photo-Q_RBVFFXR_g?w=1600&q=80","overlay_css":"linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.15))"}', '#ffffff', 48),
  ('Pink Fur',          'fun',      'unsplash', '{"type":"unsplash","photo_id":"dG9fUG0Jpos","url":"https://images.unsplash.com/photo-dG9fUG0Jpos?w=1600&q=80","overlay_css":"linear-gradient(rgba(255,255,255,0.25), rgba(255,255,255,0.05))"}', '#1a1a1a', 49),
  ('Purple Storm',      'dark',     'unsplash', '{"type":"unsplash","photo_id":"SFT9G3pAxLY","url":"https://images.unsplash.com/photo-SFT9G3pAxLY?w=1600&q=80","overlay_css":"linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.15))"}', '#ffffff', 50),
  ('Bold Strokes',      'trending', 'unsplash', '{"type":"unsplash","photo_id":"5Oe8KFH5998","url":"https://images.unsplash.com/photo-5Oe8KFH5998?w=1600&q=80","overlay_css":"linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.15))"}', '#ffffff', 51),
  ('Lavender Gradient', 'trending', 'unsplash', '{"type":"unsplash","photo_id":"IGtutkXikuc","url":"https://images.unsplash.com/photo-IGtutkXikuc?w=1600&q=80","overlay_css":"linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.15))"}', '#ffffff', 52),
  ('Sunset Gradient',   'trending', 'unsplash', '{"type":"unsplash","photo_id":"CxBx_J3yp9g","url":"https://images.unsplash.com/photo-CxBx_J3yp9g?w=1600&q=80","overlay_css":"linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.15))"}', '#ffffff', 53),
  ('Coloring Pencils',  'fun',      'unsplash', '{"type":"unsplash","photo_id":"Bg14l3hSAsA","url":"https://images.unsplash.com/photo-Bg14l3hSAsA?w=1600&q=80","overlay_css":"linear-gradient(rgba(255,255,255,0.25), rgba(255,255,255,0.05))"}', '#1a1a1a', 54),
  ('Blue Textile',      'trending', 'unsplash', '{"type":"unsplash","photo_id":"6JgOnrS9REY","url":"https://images.unsplash.com/photo-6JgOnrS9REY?w=1600&q=80","overlay_css":"linear-gradient(rgba(255,255,255,0.25), rgba(255,255,255,0.05))"}', '#1a1a1a', 55),
  ('Pink Petals',       'seasonal', 'unsplash', '{"type":"unsplash","photo_id":"95QNbCkVERM","url":"https://images.unsplash.com/photo-95QNbCkVERM?w=1600&q=80","overlay_css":"linear-gradient(rgba(255,255,255,0.25), rgba(255,255,255,0.05))"}', '#1a1a1a', 56),
  ('Spring Garden',     'seasonal', 'unsplash', '{"type":"unsplash","photo_id":"-xWyFtHExC8","url":"https://images.unsplash.com/photo--xWyFtHExC8?w=1600&q=80","overlay_css":"linear-gradient(rgba(255,255,255,0.25), rgba(255,255,255,0.05))"}', '#1a1a1a', 57),
  ('Doodle Field',      'fun',      'unsplash', '{"type":"unsplash","photo_id":"iy0AAGswt_Q","url":"https://images.unsplash.com/photo-iy0AAGswt_Q?w=1600&q=80","overlay_css":"linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.15))"}', '#ffffff', 58),
  ('Mono Bouquet',      'seasonal', 'unsplash', '{"type":"unsplash","photo_id":"1MZl_G6lWhQ","url":"https://images.unsplash.com/photo-1MZl_G6lWhQ?w=1600&q=80","overlay_css":"linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.15))"}', '#ffffff', 59),
  ('Retro Hearts',      'fun',      'unsplash', '{"type":"unsplash","photo_id":"wAqOlk_928w","url":"https://images.unsplash.com/photo-wAqOlk_928w?w=1600&q=80","overlay_css":"linear-gradient(rgba(255,255,255,0.25), rgba(255,255,255,0.05))"}', '#1a1a1a', 60),
  ('Power Lines',       'seasonal', 'unsplash', '{"type":"unsplash","photo_id":"WeavsuOadhk","url":"https://images.unsplash.com/photo-WeavsuOadhk?w=1600&q=80","overlay_css":"linear-gradient(rgba(255,255,255,0.25), rgba(255,255,255,0.05))"}', '#1a1a1a', 61),
  ('Bee Field',         'seasonal', 'unsplash', '{"type":"unsplash","photo_id":"1xeb7-BnAnQ","url":"https://images.unsplash.com/photo-1xeb7-BnAnQ?w=1600&q=80","overlay_css":"linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.15))"}', '#ffffff', 62),
  ('Fluid Pink',        'trending', 'unsplash', '{"type":"unsplash","photo_id":"Gf-RftCHbuY","url":"https://images.unsplash.com/photo-Gf-RftCHbuY?w=1600&q=80","overlay_css":"linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.15))"}', '#ffffff', 63),
  ('Glowing Orbs',      'dark',     'unsplash', '{"type":"unsplash","photo_id":"LTNj9puoxTk","url":"https://images.unsplash.com/photo-LTNj9puoxTk?w=1600&q=80","overlay_css":"linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.15))"}', '#ffffff', 64),
  ('Sunset Drawing',    'seasonal', 'unsplash', '{"type":"unsplash","photo_id":"0QUDnRJoAIE","url":"https://images.unsplash.com/photo-0QUDnRJoAIE?w=1600&q=80","overlay_css":"linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.15))"}', '#ffffff', 65),
  ('Floral Border',     'seasonal', 'unsplash', '{"type":"unsplash","photo_id":"mjsnVetyXRg","url":"https://images.unsplash.com/photo-mjsnVetyXRg?w=1600&q=80","overlay_css":"linear-gradient(rgba(255,255,255,0.25), rgba(255,255,255,0.05))"}', '#1a1a1a', 66)
on conflict (category, name) do nothing;


-- ============================================================================
-- 2. Effects (15)
-- ============================================================================
-- All configs target @tsparticles/react v3+. Particle counts kept low
-- (≤ 90 worst-case) per §9.4 to keep mobile batteries happy. The renderer
-- in Prompt 05 applies prefers-reduced-motion to disable the engine entirely.
--
-- The shape of each `config` matches the `options` prop of <Particles />.
-- ============================================================================

insert into public.effects (name, category, engine, config, order_index)
values
  ('None', 'classic', 'css', '{}'::jsonb, 0),

  ('Confetti', 'fun', 'tsparticles', $$
{
  "fpsLimit": 60,
  "fullScreen": { "enable": false },
  "detectRetina": true,
  "particles": {
    "number": { "value": 60 },
    "color": { "value": ["#ff6b9d","#f59e0b","#5b8def","#10b981","#a855f7"] },
    "shape": { "type": ["circle","square"] },
    "size": { "value": { "min": 3, "max": 7 } },
    "opacity": { "value": 0.9 },
    "move": {
      "enable": true,
      "direction": "bottom",
      "speed": { "min": 2, "max": 4 },
      "straight": false,
      "outModes": { "default": "out" }
    },
    "rotate": { "value": { "min": 0, "max": 360 }, "animation": { "enable": true, "speed": 30 } },
    "tilt": { "enable": true, "value": { "min": 0, "max": 360 }, "animation": { "enable": true, "speed": 30 } }
  }
}
$$::jsonb, 1),

  ('Snow', 'seasonal', 'tsparticles', $$
{
  "fpsLimit": 60,
  "fullScreen": { "enable": false },
  "detectRetina": true,
  "particles": {
    "number": { "value": 50 },
    "color": { "value": "#ffffff" },
    "shape": { "type": "circle" },
    "size": { "value": { "min": 1, "max": 5 } },
    "opacity": { "value": { "min": 0.4, "max": 0.9 } },
    "move": {
      "enable": true,
      "direction": "bottom",
      "speed": { "min": 0.6, "max": 1.6 },
      "straight": false,
      "outModes": { "default": "out" }
    },
    "wobble": { "enable": true, "distance": 12, "speed": { "min": -5, "max": 5 } }
  }
}
$$::jsonb, 2),

  ('Hearts', 'fun', 'tsparticles', $$
{
  "fpsLimit": 60,
  "fullScreen": { "enable": false },
  "detectRetina": true,
  "particles": {
    "number": { "value": 30 },
    "color": { "value": ["#ff4d6d","#ff85a1","#ffafcc"] },
    "shape": { "type": "char", "options": { "char": { "value": ["♥"], "font": "Apple Color Emoji, Segoe UI Emoji, sans-serif", "weight": "400" } } },
    "size": { "value": { "min": 12, "max": 22 } },
    "opacity": { "value": { "min": 0.5, "max": 0.95 } },
    "move": {
      "enable": true,
      "direction": "top",
      "speed": { "min": 1, "max": 2.5 },
      "straight": false,
      "outModes": { "default": "out" }
    }
  }
}
$$::jsonb, 3),

  ('Stars', 'classic', 'tsparticles', $$
{
  "fpsLimit": 60,
  "fullScreen": { "enable": false },
  "detectRetina": true,
  "particles": {
    "number": { "value": 50 },
    "color": { "value": "#ffffff" },
    "shape": { "type": "star" },
    "size": { "value": { "min": 1, "max": 3 } },
    "opacity": {
      "value": { "min": 0.2, "max": 0.9 },
      "animation": { "enable": true, "speed": 1.5, "sync": false }
    },
    "move": { "enable": false }
  }
}
$$::jsonb, 4),

  ('Fireworks', 'trending', 'tsparticles', $$
{
  "fpsLimit": 60,
  "fullScreen": { "enable": false },
  "detectRetina": true,
  "background": { "color": { "value": "transparent" } },
  "emitters": {
    "direction": "top",
    "rate": { "delay": 0.6, "quantity": 1 },
    "size": { "width": 100, "height": 0 },
    "position": { "x": 50, "y": 100 }
  },
  "particles": {
    "number": { "value": 0 },
    "color": { "value": ["#ff6b9d","#f59e0b","#5b8def","#10b981","#ffffff"] },
    "shape": { "type": "circle" },
    "size": { "value": 1 },
    "life": { "count": 1 },
    "destroy": {
      "mode": "split",
      "bounds": { "top": { "min": 18, "max": 38 } },
      "split": {
        "count": 1,
        "factor": { "value": 0.333 },
        "rate": { "value": { "min": 60, "max": 120 } },
        "particles": {
          "color": { "value": ["#ff6b9d","#f59e0b","#5b8def","#10b981","#ffffff"] },
          "shape": { "type": "circle" },
          "size": { "value": { "min": 1, "max": 2 } },
          "opacity": {
            "value": { "min": 0, "max": 1 },
            "animation": { "enable": true, "speed": 1, "startValue": "max", "destroy": "min" }
          },
          "life": { "count": 1, "duration": { "value": 1.2 } },
          "move": {
            "enable": true,
            "speed": { "min": 4, "max": 12 },
            "gravity": { "enable": true, "acceleration": 4 },
            "decay": 0.05,
            "outModes": { "default": "destroy" }
          }
        }
      }
    },
    "move": {
      "enable": true,
      "gravity": { "enable": true, "acceleration": 14, "inverse": true, "maxSpeed": 100 },
      "speed": { "min": 8, "max": 14 },
      "outModes": { "default": "destroy", "top": "none" }
    }
  }
}
$$::jsonb, 5),

  ('Bubbles', 'fun', 'tsparticles', $$
{
  "fpsLimit": 60,
  "fullScreen": { "enable": false },
  "detectRetina": true,
  "particles": {
    "number": { "value": 30 },
    "color": { "value": "#ffffff" },
    "shape": { "type": "circle" },
    "size": { "value": { "min": 4, "max": 14 } },
    "opacity": { "value": { "min": 0.2, "max": 0.55 } },
    "stroke": { "width": 1, "color": { "value": "#ffffff" } },
    "move": {
      "enable": true,
      "direction": "top",
      "speed": { "min": 0.6, "max": 1.6 },
      "straight": false,
      "outModes": { "default": "out" }
    }
  }
}
$$::jsonb, 6),

  ('Sparkles', 'classic', 'tsparticles', $$
{
  "fpsLimit": 60,
  "fullScreen": { "enable": false },
  "detectRetina": true,
  "particles": {
    "number": { "value": 40 },
    "color": { "value": ["#ffffff","#fde68a","#fbcfe8"] },
    "shape": { "type": "star" },
    "size": { "value": { "min": 0.5, "max": 2.5 } },
    "opacity": {
      "value": { "min": 0, "max": 0.95 },
      "animation": { "enable": true, "speed": 2, "sync": false, "startValue": "min", "destroy": "min" }
    },
    "move": { "enable": false }
  }
}
$$::jsonb, 7),

  ('Emoji rain', 'fun', 'tsparticles', $$
{
  "fpsLimit": 60,
  "fullScreen": { "enable": false },
  "detectRetina": true,
  "particles": {
    "number": { "value": 30 },
    "shape": { "type": "char", "options": { "char": { "value": ["🎉"], "font": "Apple Color Emoji, Segoe UI Emoji, sans-serif", "weight": "400" } } },
    "size": { "value": { "min": 14, "max": 24 } },
    "opacity": { "value": 0.95 },
    "move": {
      "enable": true,
      "direction": "bottom",
      "speed": { "min": 1.5, "max": 3.5 },
      "straight": false,
      "outModes": { "default": "out" }
    },
    "rotate": { "value": { "min": 0, "max": 360 }, "animation": { "enable": true, "speed": 12 } }
  }
}
$$::jsonb, 8),

  ('Petals', 'seasonal', 'tsparticles', $$
{
  "fpsLimit": 60,
  "fullScreen": { "enable": false },
  "detectRetina": true,
  "particles": {
    "number": { "value": 35 },
    "color": { "value": ["#ffd1ec","#ffafcc","#ffc4d6"] },
    "shape": { "type": "char", "options": { "char": { "value": ["✿"], "font": "Apple Color Emoji, Segoe UI Emoji, sans-serif", "weight": "400" } } },
    "size": { "value": { "min": 8, "max": 16 } },
    "opacity": { "value": { "min": 0.6, "max": 0.95 } },
    "move": {
      "enable": true,
      "direction": "bottom",
      "speed": { "min": 1, "max": 2.2 },
      "straight": false,
      "outModes": { "default": "out" }
    },
    "rotate": { "value": { "min": 0, "max": 360 }, "animation": { "enable": true, "speed": 8 } },
    "wobble": { "enable": true, "distance": 24, "speed": { "min": -4, "max": 4 } }
  }
}
$$::jsonb, 9),

  ('Rain', 'classic', 'tsparticles', $$
{
  "fpsLimit": 60,
  "fullScreen": { "enable": false },
  "detectRetina": true,
  "particles": {
    "number": { "value": 60 },
    "color": { "value": "#bcd4e6" },
    "shape": { "type": "line" },
    "size": { "value": { "min": 8, "max": 14 } },
    "opacity": { "value": { "min": 0.3, "max": 0.6 } },
    "move": {
      "enable": true,
      "direction": "bottom",
      "speed": { "min": 12, "max": 18 },
      "straight": true,
      "outModes": { "default": "out" }
    }
  }
}
$$::jsonb, 10),

  ('Embers', 'seasonal', 'tsparticles', $$
{
  "fpsLimit": 60,
  "fullScreen": { "enable": false },
  "detectRetina": true,
  "particles": {
    "number": { "value": 35 },
    "color": { "value": ["#ff8a00","#ff5722","#ffcb52"] },
    "shape": { "type": "circle" },
    "size": { "value": { "min": 1, "max": 3 } },
    "opacity": {
      "value": { "min": 0.3, "max": 0.9 },
      "animation": { "enable": true, "speed": 1.5, "sync": false }
    },
    "move": {
      "enable": true,
      "direction": "top",
      "speed": { "min": 0.8, "max": 2.2 },
      "straight": false,
      "outModes": { "default": "out" }
    }
  }
}
$$::jsonb, 11),

  ('Balloons', 'fun', 'tsparticles', $$
{
  "fpsLimit": 60,
  "fullScreen": { "enable": false },
  "detectRetina": true,
  "particles": {
    "number": { "value": 18 },
    "shape": { "type": "char", "options": { "char": { "value": ["🎈"], "font": "Apple Color Emoji, Segoe UI Emoji, sans-serif", "weight": "400" } } },
    "size": { "value": { "min": 18, "max": 28 } },
    "opacity": { "value": 1 },
    "move": {
      "enable": true,
      "direction": "top",
      "speed": { "min": 1.2, "max": 2.4 },
      "straight": false,
      "outModes": { "default": "out" }
    }
  }
}
$$::jsonb, 12),

  ('Lights', 'classic', 'tsparticles', $$
{
  "fpsLimit": 60,
  "fullScreen": { "enable": false },
  "detectRetina": true,
  "particles": {
    "number": { "value": 30 },
    "color": { "value": ["#ffd16b","#fff3b0","#ffffff"] },
    "shape": { "type": "circle" },
    "size": { "value": { "min": 4, "max": 12 } },
    "opacity": {
      "value": { "min": 0.3, "max": 0.85 },
      "animation": { "enable": true, "speed": 1, "sync": false }
    },
    "move": { "enable": false },
    "shadow": { "enable": true, "color": { "value": "#ffd16b" }, "blur": 8 }
  }
}
$$::jsonb, 13),

  ('Snow heavy', 'seasonal', 'tsparticles', $$
{
  "fpsLimit": 60,
  "fullScreen": { "enable": false },
  "detectRetina": true,
  "particles": {
    "number": { "value": 90 },
    "color": { "value": "#ffffff" },
    "shape": { "type": "circle" },
    "size": { "value": { "min": 1, "max": 4 } },
    "opacity": { "value": { "min": 0.5, "max": 0.95 } },
    "move": {
      "enable": true,
      "direction": "bottom",
      "speed": { "min": 1.2, "max": 2.6 },
      "straight": false,
      "outModes": { "default": "out" }
    },
    "wobble": { "enable": true, "distance": 18, "speed": { "min": -8, "max": 8 } }
  }
}
$$::jsonb, 14)
on conflict (name) do nothing;


-- ============================================================================
-- 3. Font presets (10)
-- ============================================================================
-- Every font in this list was verified against the Google Fonts metadata API
-- to confirm the `cyrillic` subset is present. Spec candidates that lacked
-- Cyrillic (Italiana, Cinzel, Major Mono Display, Caveat Brush, Space Mono)
-- were swapped — see deviations in the prompt 04 report. Latin-ext is also
-- present on all 10 fonts for Az diacritics (ə ç ş ğ ı ö ü).
-- ============================================================================

insert into public.font_presets (category, name, font_family, font_weight, letter_spacing, text_transform, supports_az, supports_ru)
values
  ('classic',  'Inter',              'Inter',              500, '-0.01em',  'none', true, true),
  ('classic',  'IBM Plex Sans',      'IBM Plex Sans',      500, 'normal',   'none', true, true),
  ('eclectic', 'Caveat',             'Caveat',             600, 'normal',   'none', true, true),
  ('eclectic', 'Pacifico',           'Pacifico',           400, 'normal',   'none', true, true),
  ('fancy',    'Yeseva One',         'Yeseva One',         400, '0',        'none', true, true),
  ('literary', 'Cormorant Garamond', 'Cormorant Garamond', 500, '0.01em',   'none', true, true),
  ('literary', 'PT Serif',           'PT Serif',           400, 'normal',   'none', true, true),
  ('digital',  'JetBrains Mono',     'JetBrains Mono',     500, '0',        'none', true, true),
  ('elegant',  'Playfair Display',   'Playfair Display',   600, '-0.01em',  'none', true, true),
  ('elegant',  'Lora',               'Lora',               500, '0',        'none', true, true)
on conflict (font_family, font_weight) do nothing;
