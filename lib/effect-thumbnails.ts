// Static representative thumbnails for each effect. Used by the EffectPicker
// (grid circles) and the EditorRail (current-effect button icon). TODO: real
// animated previews land in a follow-up to Prompt 06.
//
// Keys match the `name` column of `public.effects`. Add a row here for any
// new effect — missing keys fall back to '✨' at the call site.

export const EFFECT_THUMBNAILS: Record<string, string> = {
  None: '🚫',
  Confetti: '🎉',
  Snow: '❄️',
  Hearts: '💖',
  Stars: '🌟',
  Fireworks: '🎆',
  Bubbles: '🫧',
  Sparkles: '✨',
  'Emoji rain': '🎊',
  Petals: '🌸',
  Rain: '🌧️',
  Embers: '🔥',
  Balloons: '🎈',
  Lights: '🪔',
  'Snow heavy': '🌨️',
}

export function effectThumbnail(name: string | undefined | null): string {
  if (!name) return '🚫'
  return EFFECT_THUMBNAILS[name] ?? '✨'
}
