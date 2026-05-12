-- 11a.1 — Email uniqueness on the guests table.
--
-- [11a] added a partial unique index for phone within an event; email was
-- left unconstrained, which let a host accidentally add the same email
-- twice for one event. Mirrors the phone constraint exactly: partial
-- unique only when email is non-null, so legacy / phone-only rows still
-- coexist.
--
-- Server-side `addGuest` already lowercases emails before insert, so this
-- index naturally case-insensitive-dedupes for normal use. Gmail-style
-- `+alias` variants would still slip through — out of scope for this
-- bugfix pass.

create unique index if not exists guests_event_id_email_unique
  on public.guests (event_id, email)
  where email is not null;
