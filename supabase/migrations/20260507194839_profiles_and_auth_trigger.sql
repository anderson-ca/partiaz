-- 1. profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  locale text not null default 'az' check (locale in ('az', 'ru', 'en')),
  phone text,
  created_at timestamptz not null default now()
);

-- 2. RLS
alter table public.profiles enable row level security;

create policy "profiles_select_self"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_self"
  on public.profiles for update
  using (auth.uid() = id);

-- 3. Trigger function: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- 4. Trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
