-- ui-8.1 — Schema for host payment-info display surface.
--
-- Two columns, no UI yet (lands in ui-8.2 / ui-8.3):
--
--   • profiles.payment_methods (jsonb, nullable)
--     Per-host structured payment identifiers — IBAN, m10 phone, Birbank
--     phone. Shape enforced at the application layer via the Zod schema
--     in lib/schemas/payment.ts (this is the canonical source — DB stays
--     permissive so future rails don't require migrations).
--     Current shape: { iban?: string, m10_phone?: string, birbank_phone?: string }
--     null = host hasn't entered anything; {} = explicit "no methods".
--
--   • events.show_payment_info (bool, default false)
--     Per-event opt-in. When true AND the host has at least one method,
--     the public event page renders a contribute card above the RSVP
--     card. Defaults off so existing events don't suddenly start
--     soliciting payments.
--
-- Both columns use `add column if not exists` so the migration is safely
-- re-runnable in dev / against partial-apply states.

alter table public.profiles
  add column if not exists payment_methods jsonb;

comment on column public.profiles.payment_methods is
  'Per-host structured payment identifiers (IBAN, m10 phone, Birbank phone). Shape validated by lib/schemas/payment.ts. null = unset, {} = explicit empty.';

alter table public.events
  add column if not exists show_payment_info boolean not null default false;

comment on column public.events.show_payment_info is
  'Per-event opt-in for rendering the host''s payment_methods on the public event page. Defaults off.';
