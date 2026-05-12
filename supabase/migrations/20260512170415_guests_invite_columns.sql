-- 11a — Guest-list data model (manual-add UI in the same prompt).
--
-- Audit against the Prompt 03 baseline `guests` table:
--   • `name`       — exists (text not null default '')
--   • `phone`      — exists (text nullable)
--   • `email`      — exists (text nullable)
--   • `invited_at` — exists (timestamptz nullable, reserved for 11c)
--   • `invite_channel` — MISSING; add now
--
-- Only `invite_channel` is added here. It stays unused until 11c wires the
-- actual send flow.
--
-- Partial unique index on `(event_id, phone) WHERE phone IS NOT NULL`
-- prevents duplicate phone entries within a single event while still
-- permitting many NULL-phone rows (legacy / email-only guests, walk-ins).

alter table public.guests
  add column invite_channel text
    check (invite_channel is null or invite_channel in ('sms', 'email', 'whatsapp'));

create unique index if not exists guests_event_id_phone_unique
  on public.guests (event_id, phone)
  where phone is not null;
