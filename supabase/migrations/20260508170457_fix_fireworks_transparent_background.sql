-- ============================================================================
-- Fireworks: drop the `background.color.value: "transparent"` property
-- ============================================================================
-- tsParticles' color parser doesn't accept the CSS keyword `transparent`
-- (only hex / rgb(a) / hsl / a small set of named colors). The Fireworks
-- config we seeded in Prompt 04 set `background.color.value: "transparent"`
-- which threw "Color not found 'transparent'" on every frame.
--
-- Fix: remove the `background` property entirely. With `fullScreen.enable:
-- false` (which we set), the <Particles> canvas is transparent by default;
-- explicitly setting it adds nothing useful.
-- ============================================================================

update public.effects
set config = config - 'background'
where name = 'Fireworks';
