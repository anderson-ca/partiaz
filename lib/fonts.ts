import {
  Caveat,
  Cormorant_Garamond,
  IBM_Plex_Sans,
  Inter,
  JetBrains_Mono,
  Lora,
  PT_Serif,
  Pacifico,
  Playfair_Display,
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
}
