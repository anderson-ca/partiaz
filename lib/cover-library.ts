// Curated cover-image library for v1.
//
// Hardcoded — not loaded from the DB at runtime. The picker UI shows these
// 15 as the "Library" tab; selecting one stores its `url` directly in
// `events.cover_image_url` with `cover_image_source = 'library'`. URLs are
// reused from the `themes` table (background_type = 'unsplash') because
// those are already vetted (no people / objects / landmarks) and have CDN
// URLs that resolve through next/image's remotePatterns whitelist.
//
// To extend: pick additional URLs from a known-good source, slugify the
// name into a stable id, and append. Don't mutate ids of existing entries
// — if events ever store the id we'd break references.

export type CoverCategory = 'celebration' | 'abstract' | 'nature' | 'neon'

export type LibraryCover = {
  id: string
  url: string
  alt: string
  category: CoverCategory
}

export const COVER_LIBRARY: LibraryCover[] = [
  // celebration
  {
    id: 'confetti',
    url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1600&q=80',
    alt: 'Multicolored confetti scattered',
    category: 'celebration',
  },
  {
    id: 'balloons',
    url: 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=1600&q=80',
    alt: 'Colorful hot air balloons against sky',
    category: 'celebration',
  },
  {
    id: 'pink-glitter',
    url: 'https://images.unsplash.com/photo-1502741509793-1bf00d85aeff?w=1600&q=80',
    alt: 'Pink glitter bokeh close-up',
    category: 'celebration',
  },
  {
    id: 'yellow-dots',
    url: 'https://images.unsplash.com/photo-1516641051054-9df6a1aad654?w=1600&q=80',
    alt: 'Yellow background with small dots',
    category: 'celebration',
  },

  // abstract
  {
    id: 'color-wash',
    url: 'https://images.unsplash.com/photo-1564934304050-e9bb87a29c13?w=1600&q=80',
    alt: 'Multicolored painted wash',
    category: 'abstract',
  },
  {
    id: 'bold-strokes',
    url: 'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=1600&q=80',
    alt: 'Green yellow and red abstract painting',
    category: 'abstract',
  },
  {
    id: 'color-smoke',
    url: 'https://images.unsplash.com/photo-1558470598-a5dda9640f68?w=1600&q=80',
    alt: 'Assorted color smoke',
    category: 'abstract',
  },
  {
    id: 'lavender-gradient',
    url: 'https://images.unsplash.com/photo-1620503292890-c597f62cce8d?w=1600&q=80',
    alt: 'Light blue to purple gradient',
    category: 'abstract',
  },
  {
    id: 'sea-glass',
    url: 'https://images.unsplash.com/photo-1729575846509-0ed233b0c2b0?w=1600&q=80',
    alt: 'Blurry blue and green abstract',
    category: 'abstract',
  },

  // nature
  {
    id: 'bloom',
    url: 'https://images.unsplash.com/photo-1508717272800-9fff97da7e8f?w=1600&q=80',
    alt: 'Pink and white flowers on white surface',
    category: 'nature',
  },
  {
    id: 'cloud-sea',
    url: 'https://images.unsplash.com/photo-1496450681664-3df85efbd29f?w=1600&q=80',
    alt: 'Sea of clouds',
    category: 'nature',
  },
  {
    id: 'pastel-sky',
    url: 'https://images.unsplash.com/photo-1554034483-04fda0d3507b?w=1600&q=80',
    alt: 'Pink and blue sky with a few clouds',
    category: 'nature',
  },

  // neon
  {
    id: 'neon-light',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1600&q=80',
    alt: 'Blue and pink neon light',
    category: 'neon',
  },
  {
    id: 'faded-lights',
    url: 'https://images.unsplash.com/photo-1489379391348-c9f07b42b696?w=1600&q=80',
    alt: 'Faded green lights digital wallpaper',
    category: 'neon',
  },
  {
    id: 'galaxy',
    url: 'https://images.unsplash.com/photo-1629654858857-615c2c8be8a8?w=1600&q=80',
    alt: 'Galaxy view on night sky',
    category: 'neon',
  },
]
