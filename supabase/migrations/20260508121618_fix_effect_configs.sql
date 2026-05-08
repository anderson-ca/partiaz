-- ============================================================================
-- Fix Rain and Sparkles effect configs
-- ============================================================================
-- Two config-level bugs surfaced when rendering with @tsparticles/all:
--
--   Rain:     shape `line` renders via the particle's `stroke` — without
--             a stroke width/color the line has 0 px width and is invisible.
--   Sparkles: size 0.5–2.5 was too small to perceive (Stars uses 1–3 and
--             reads fine), and `opacity.animation.destroy: "min"` destroyed
--             particles as they faded, so the count depleted (the engine
--             doesn't auto-respawn destroyed particles by default).
-- ============================================================================

update public.effects
set config = $$
{
  "fpsLimit": 60,
  "fullScreen": { "enable": false },
  "detectRetina": true,
  "particles": {
    "number": { "value": 60 },
    "color": { "value": "#bcd4e6" },
    "shape": { "type": "line" },
    "stroke": { "width": 1, "color": { "value": "#bcd4e6" } },
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
$$::jsonb
where name = 'Rain';

update public.effects
set config = $$
{
  "fpsLimit": 60,
  "fullScreen": { "enable": false },
  "detectRetina": true,
  "particles": {
    "number": { "value": 40 },
    "color": { "value": ["#ffffff","#fde68a","#fbcfe8"] },
    "shape": { "type": "star" },
    "size": { "value": { "min": 1, "max": 3 } },
    "opacity": {
      "value": { "min": 0.2, "max": 0.95 },
      "animation": { "enable": true, "speed": 2, "sync": false }
    },
    "move": { "enable": false }
  }
}
$$::jsonb
where name = 'Sparkles';
