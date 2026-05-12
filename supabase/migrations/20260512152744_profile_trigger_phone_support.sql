-- 10.5 — Phone auth via Twilio Verify.
--
-- Two surgical changes to the existing profile bootstrap:
--   1. Replace handle_new_user() so phone-only signups (no email) populate
--      `profiles.phone` from `auth.users.phone`. The existing trigger only
--      copied display_name/avatar from raw_user_meta_data; phone was on
--      auth.users.phone but never mirrored to public.profiles.
--   2. Partial unique index on profiles.phone so future "find user by
--      phone" lookups (linking accounts, deduping) can rely on uniqueness.
--      `WHERE phone IS NOT NULL` lets all the existing email-only profile
--      rows (phone = NULL) coexist without conflict.
--
-- `display_name` still falls through to NULL for phone-only signups, which
-- is what the post-OTP "What should we call you?" step expects.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, phone)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      -- split_part returns '' (not NULL) for NULL input in some versions;
      -- nullif normalizes the empty-string case so coalesce keeps falling
      -- through to NULL for phone-only signups.
      nullif(split_part(new.email, '@', 1), '')
    ),
    new.raw_user_meta_data->>'avatar_url',
    new.phone
  );
  return new;
end;
$$;

create unique index if not exists profiles_phone_unique
  on public.profiles (phone)
  where phone is not null;
