import {
  Bad_Script,
  Caveat,
  Cormorant_Garamond,
  EB_Garamond,
  Forum,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Inter,
  JetBrains_Mono,
  Lobster,
  Lora,
  Manrope,
  Marck_Script,
  Merriweather,
  Mulish,
  Nunito,
  Onest,
  PT_Serif,
  Pacifico,
  Playfair_Display,
  Roboto_Mono,
  Rubik,
  Source_Serif_4,
  Tenor_Sans,
  Yeseva_One,
} from 'next/font/google'

// Variable fonts (full weight axis loaded automatically)
export const inter = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter',
})

export const caveat = Caveat({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  variable: '--font-caveat',
})

export const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
})

export const playfairDisplay = Playfair_Display({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  variable: '--font-playfair-display',
})

export const lora = Lora({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  variable: '--font-lora',
})

// Fixed-weight fonts — request the weights we use in the catalog
export const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-sans',
})

export const pacifico = Pacifico({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  weight: ['400'],
  variable: '--font-pacifico',
})

export const yesevaOne = Yeseva_One({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  weight: ['400'],
  variable: '--font-yeseva-one',
})

export const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  weight: ['400', '500', '600'],
  variable: '--font-cormorant-garamond',
})

export const ptSerif = PT_Serif({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  weight: ['400', '700'],
  variable: '--font-pt-serif',
})

// ─── [ui-6a] catalog expansion ─────────────────────────────────────────
// 17 new presets. Variable fonts omit `weight` (axis loaded); non-variable
// fonts specify the picker-rendering weight per category convention. All
// presets request cyrillic + latin-ext + latin subsets — Cyrillic-verified
// against Google Fonts catalog (see [ui-6a] investigation).

// SANS (classic) — all variable. Rubik + Nunito substituted for Space
// Grotesk + DM Sans which failed the next/font/google Cyrillic type check.
export const rubik = Rubik({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  variable: '--font-rubik',
})

export const nunito = Nunito({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  variable: '--font-nunito',
})

export const manrope = Manrope({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  variable: '--font-manrope',
})

export const onest = Onest({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  variable: '--font-onest',
})

export const mulish = Mulish({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  variable: '--font-mulish',
})

// SERIF (literary) — EB Garamond, Source Serif 4, Crimson Pro variable;
// Merriweather non-variable (substituted for Spectral, Cyrillic gap).
export const ebGaramond = EB_Garamond({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  variable: '--font-eb-garamond',
})

export const sourceSerif4 = Source_Serif_4({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  variable: '--font-source-serif-4',
})

export const merriweather = Merriweather({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  weight: ['500'],
  variable: '--font-merriweather',
})

// DISPLAY (fancy) — Forum + Tenor Sans + Lobster all single-weight. Bodoni
// Moda dropped (no Cyrillic substitute found on Google Fonts). Lobster's
// bold retro caps + stable baseline read as DISPLAY, not HANDWRITTEN.
export const forum = Forum({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  weight: ['400'],
  variable: '--font-forum',
})

export const tenorSans = Tenor_Sans({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  weight: ['400'],
  variable: '--font-tenor-sans',
})

export const lobster = Lobster({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  weight: ['400'],
  variable: '--font-lobster',
})

// HANDWRITTEN (eclectic) — Marck Script + Bad Script Cyrillic-native
// scripts, both single-weight. Dancing Script removed (Cyrillic gap); its
// substitute Lobster relocated to DISPLAY per its visual personality.
export const marckScript = Marck_Script({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  weight: ['400'],
  variable: '--font-marck-script',
})

export const badScript = Bad_Script({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  weight: ['400'],
  variable: '--font-bad-script',
})

// MONO (digital) — IBM Plex Mono non-variable (weight 500 to match category);
// Roboto Mono variable.
export const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  weight: ['500'],
  variable: '--font-ibm-plex-mono',
})

export const robotoMono = Roboto_Mono({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  variable: '--font-roboto-mono',
})

// One className that activates every font variable on <html>.
// next/font's `.variable` is a generated className like `__variable_xxx`
// that *sets* the requested CSS variable on the element.
export const allFontVariables = [
  inter.variable,
  ibmPlexSans.variable,
  caveat.variable,
  pacifico.variable,
  yesevaOne.variable,
  cormorantGaramond.variable,
  ptSerif.variable,
  jetBrainsMono.variable,
  playfairDisplay.variable,
  lora.variable,
  // [ui-6a] catalog expansion — order mirrors the imports above
  rubik.variable,
  nunito.variable,
  manrope.variable,
  onest.variable,
  mulish.variable,
  ebGaramond.variable,
  sourceSerif4.variable,
  merriweather.variable,
  forum.variable,
  tenorSans.variable,
  lobster.variable,
  marckScript.variable,
  badScript.variable,
  ibmPlexMono.variable,
  robotoMono.variable,
].join(' ')

// Map from the `font_family` value stored in `font_presets` to the CSS
// variable name (the one we passed in `variable: '--font-…'`). Used by
// EventTitle: `style={{ fontFamily: 'var(--font-inter)' }}`. If a row's
// font_family isn't here, EventTitle falls back to Inter.
export const fontFamilyToCssVar: Record<string, string> = {
  Inter: '--font-inter',
  'IBM Plex Sans': '--font-ibm-plex-sans',
  Caveat: '--font-caveat',
  Pacifico: '--font-pacifico',
  'Yeseva One': '--font-yeseva-one',
  'Cormorant Garamond': '--font-cormorant-garamond',
  'PT Serif': '--font-pt-serif',
  'JetBrains Mono': '--font-jetbrains-mono',
  'Playfair Display': '--font-playfair-display',
  Lora: '--font-lora',
  // [ui-6a] catalog expansion
  Rubik: '--font-rubik',
  Nunito: '--font-nunito',
  Manrope: '--font-manrope',
  Onest: '--font-onest',
  Mulish: '--font-mulish',
  'EB Garamond': '--font-eb-garamond',
  'Source Serif 4': '--font-source-serif-4',
  Merriweather: '--font-merriweather',
  Forum: '--font-forum',
  'Tenor Sans': '--font-tenor-sans',
  Lobster: '--font-lobster',
  'Marck Script': '--font-marck-script',
  'Bad Script': '--font-bad-script',
  'IBM Plex Mono': '--font-ibm-plex-mono',
  'Roboto Mono': '--font-roboto-mono',
}
