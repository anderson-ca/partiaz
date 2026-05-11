-- 09.84 — Resolve the location/description/date editor TODOs.
--
-- Most fields needed by the new editor inputs already existed on `events`
-- from the Prompt 03 baseline:
--   • starts_at / ends_at  timestamptz, nullable
--   • description          text,        nullable
--   • location_text        text,        nullable   ← used for the venue name
--   • location_url         text,        nullable   ← reserved for a maps URL
--   • timezone             text         default 'Asia/Baku'
--
-- What's missing is a free-text *address* field (street, building, district).
-- `location_url` is reserved for a maps link, not a postal-style address, so
-- the address gets its own column.

alter table events
  add column location_address text;
