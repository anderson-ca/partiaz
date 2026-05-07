-- ============================================================================
-- Fix Unsplash CDN URLs and drop unusable themes
-- ============================================================================
-- Prompt 04 stored a reconstructed shorthand URL (`photo-{api_id}`) that the
-- Unsplash CDN doesn't actually serve — the real CDN uses opaque numeric
-- filenames like `photo-1513151233558-d860c5398176`. This migration:
--
--   1. Deletes 14 themes whose CDN URL was either unavailable (4) or whose
--      photo turned out to be Unsplash+ premium content with restricted
--      licensing (10).
--   2. Updates the remaining 32 unsplash-type themes with their real CDN
--      URLs (one is on the /flagged/ subpath — preserved verbatim).
--
-- After this migration the theme catalog totals 52 rows:
--   12 gradients + 32 unsplash + 6 patterns + 2 solids
-- ============================================================================


-- ----- 1. Delete 14 themes by photo_id --------------------------------------

delete from public.themes
where background_type = 'unsplash'
  and background_value->>'photo_id' in (
    'CxBx_J3yp9g',
    'Bg14l3hSAsA',
    '6JgOnrS9REY',
    '95QNbCkVERM',
    '-xWyFtHExC8',
    'iy0AAGswt_Q',
    '1MZl_G6lWhQ',
    'wAqOlk_928w',
    'WeavsuOadhk',
    '1xeb7-BnAnQ',
    'Gf-RftCHbuY',
    'LTNj9puoxTk',
    '0QUDnRJoAIE',
    'mjsnVetyXRg'
  );


-- ----- 2. Update remaining 32 URLs ------------------------------------------
-- Single UPDATE with a VALUES join keyed on photo_id. jsonb_set replaces just
-- the `url` field in the existing background_value object, leaving photo_id /
-- type / overlay_css untouched.

update public.themes t
set background_value = jsonb_set(
  t.background_value,
  '{url}',
  to_jsonb(m.cdn_url)
)
from (values
  ('Xaanw0s0pMk', 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1600&q=80'),
  ('qjCHPZbeXCQ', 'https://images.unsplash.com/photo-1503455637927-730bce8583c0?w=1600&q=80'),
  ('cxE7SXKnzv0', 'https://images.unsplash.com/photo-1508717272800-9fff97da7e8f?w=1600&q=80'),
  ('GLf7bAwCdYg', 'https://images.unsplash.com/photo-1554034483-04fda0d3507b?w=1600&q=80'),
  ('9XngoIpxcEo', 'https://images.unsplash.com/photo-1563089145-599997674d42?w=1600&q=80'),
  ('4dpAqfTbvKA', 'https://images.unsplash.com/photo-1465101162946-4377e57745c3?w=1600&q=80'),
  ('XgeZu2jBaVI', 'https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=1600&q=80'),
  ('KAgGjw4HgNY', 'https://images.unsplash.com/photo-1503480207415-fdddcc21d5fc?w=1600&q=80'),
  ('DuBNA1QMpPA', 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=1600&q=80'),
  ('LeG68PrXA6Y', 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1600&q=80'),
  ('QRghuf5yTA4', 'https://images.unsplash.com/photo-1581985283743-abc20b6d8993?w=1600&q=80'),
  ('gREi-9tI5Mg', 'https://images.unsplash.com/photo-1517707711963-adf9078bdf01?w=1600&q=80'),
  ('S8bde3hkBR8', 'https://images.unsplash.com/photo-1516641051054-9df6a1aad654?w=1600&q=80'),
  ('KvTOwKoji7g', 'https://images.unsplash.com/photo-1499088513455-78ed88b7a5b4?w=1600&q=80'),
  ('oAGL8j9GKLc', 'https://images.unsplash.com/photo-1729575846509-0ed233b0c2b0?w=1600&q=80'),
  ('3k9PGKWt7ik', 'https://images.unsplash.com/photo-1558470598-a5dda9640f68?w=1600&q=80'),
  ('Lll4QeybDEg', 'https://images.unsplash.com/photo-1489379391348-c9f07b42b696?w=1600&q=80'),
  ('YXQew2KZjzY', 'https://images.unsplash.com/photo-1564934304050-e9bb87a29c13?w=1600&q=80'),
  ('Uvl3W4XWd4U', 'https://images.unsplash.com/photo-1502741509793-1bf00d85aeff?w=1600&q=80'),
  ('r2F5ZIEUPtk', 'https://images.unsplash.com/photo-1603847734787-9e8a3f3e9d60?w=1600&q=80'),
  ('LtWFFVi1RXQ', 'https://images.unsplash.com/photo-1496450681664-3df85efbd29f?w=1600&q=80'),
  ('VdFkSO3uePI', 'https://images.unsplash.com/photo-1502679726485-931beda67f88?w=1600&q=80'),
  ('SshYpuf607g', 'https://images.unsplash.com/photo-1503264116251-35a269479413?w=1600&q=80'),
  ('87PP9Zd7MNo', 'https://images.unsplash.com/photo-1635776062360-af423602aff3?w=1600&q=80'),
  ('h8nxGssjQXs', 'https://images.unsplash.com/photo-1500236861371-c749e9a06b46?w=1600&q=80'),
  ('o-fmysR2y7Y', 'https://images.unsplash.com/photo-1629654858857-615c2c8be8a8?w=1600&q=80'),
  ('kOajnscQxW8', 'https://images.unsplash.com/photo-1520034475321-cbe63696469a?w=1600&q=80'),
  ('Q_RBVFFXR_g', 'https://images.unsplash.com/photo-1516642898673-edd1ced08e87?w=1600&q=80'),
  ('dG9fUG0Jpos', 'https://images.unsplash.com/flagged/photo-1567400358593-9e6382752ea2?w=1600&q=80'),
  ('SFT9G3pAxLY', 'https://images.unsplash.com/photo-1557683311-eac922347aa1?w=1600&q=80'),
  ('5Oe8KFH5998', 'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=1600&q=80'),
  ('IGtutkXikuc', 'https://images.unsplash.com/photo-1620503292890-c597f62cce8d?w=1600&q=80')
) as m(photo_id, cdn_url)
where t.background_type = 'unsplash'
  and t.background_value->>'photo_id' = m.photo_id;
