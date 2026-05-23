-- Fix "Database error querying schema" on login for SQL-seeded auth users.
-- GoTrue cannot scan NULL in token columns — they must be '' (empty string).
-- See: https://github.com/supabase/auth/issues/1940

update auth.users
set
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  email_change = coalesce(email_change, '')
where
  confirmation_token is null
  or recovery_token is null
  or email_change_token_new is null
  or email_change is null;

-- Safer profiles read policy (avoid officer helper on same table)
drop policy if exists profiles_select_own on public.profiles;

create policy profiles_select_own
  on public.profiles for select
  using (id = auth.uid());

create policy profiles_select_officer_all
  on public.profiles for select
  using (public.is_officer());
