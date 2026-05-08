// Discriminated unions for the JSON shape stored in `themes.background_value`.
// The DB has `background_type` as a check-constrained text column; here we
// mirror it as a TS literal union and structurally type the JSON payload.
//
// Storing this as a TS-side schema (rather than running zod on every render)
// because the renderer is a Server Component and the rows come from our own
// DB, not user input. If we ever expose a "create theme" UI we'll add zod.

export type ThemeGradient = {
  type: 'gradient'
  css: string
}

export type ThemeUnsplash = {
  type: 'unsplash'
  photo_id: string
  url: string
  overlay_css: string
}

export type ThemePattern = {
  type: 'pattern'
  svg_url: string
  background_color: string
  scale: number
}

export type ThemeSolid = {
  type: 'solid'
  color: string
}

export type ThemeBackgroundValue =
  | ThemeGradient
  | ThemeUnsplash
  | ThemePattern
  | ThemeSolid

export type ThemeBackgroundType = ThemeBackgroundValue['type']

export type ThemeRow = {
  id: string
  name: string
  category: string
  background_type: ThemeBackgroundType
  background_value: ThemeBackgroundValue
  recommended_text_color: string
  order_index: number
}
