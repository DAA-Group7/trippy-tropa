-- Trippy-Tropa RBAC: profile bootstrap, helpers, and row-level security

-- ---------------------------------------------------------------------------
-- Profile auto-create on sign-up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role public.user_role;
  is_seed boolean;
begin
  is_seed := coalesce((new.raw_app_meta_data->>'seed')::boolean, false);
  assigned_role := coalesce(
    (new.raw_user_meta_data->>'role')::public.user_role,
    'student'::public.user_role
  );

  -- Self-registration cannot elevate to officer (only seeds / service role)
  if assigned_role = 'officer'::public.user_role and not is_seed then
    assigned_role := 'student'::public.user_role;
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    ),
    assigned_role
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    role = excluded.role;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Role helpers (for RLS policies)
-- ---------------------------------------------------------------------------
create or replace function public.auth_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid();
$$;

create or replace function public.is_officer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'officer'::public.user_role
  );
$$;

create or replace function public.is_student()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'student'::public.user_role
  );
$$;

create or replace function public.is_classroom_member(p_classroom_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.classroom_members
    where classroom_id = p_classroom_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.owns_classroom(p_classroom_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.classrooms
    where id = p_classroom_id
      and created_by = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS on all app tables
-- ---------------------------------------------------------------------------
alter table public.skill_ratings enable row level security;
alter table public.classroom_members enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.notifications enable row level security;

-- Drop dev-open policies from 002
drop policy if exists "Anyone can read classrooms by invite" on public.classrooms;
drop policy if exists "Authenticated and anon can create classrooms" on public.classrooms;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy profiles_select_own
  on public.profiles for select
  using (id = auth.uid() or public.is_officer());

create policy profiles_update_own
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- skill_ratings
-- ---------------------------------------------------------------------------
create policy skill_ratings_select_own
  on public.skill_ratings for select
  using (user_id = auth.uid() or public.is_officer());

create policy skill_ratings_insert_own
  on public.skill_ratings for insert
  with check (user_id = auth.uid() and public.is_student());

create policy skill_ratings_update_own
  on public.skill_ratings for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- classrooms (invite preview: anon/authenticated may read for join flow)
-- ---------------------------------------------------------------------------
create policy classrooms_select
  on public.classrooms for select
  using (
    true
  );

create policy classrooms_insert_officer
  on public.classrooms for insert
  with check (public.is_officer());

create policy classrooms_update_officer
  on public.classrooms for update
  using (created_by = auth.uid() and public.is_officer())
  with check (created_by = auth.uid() and public.is_officer());

create policy classrooms_delete_officer
  on public.classrooms for delete
  using (created_by = auth.uid() and public.is_officer());

-- ---------------------------------------------------------------------------
-- classroom_members
-- ---------------------------------------------------------------------------
create policy classroom_members_select
  on public.classroom_members for select
  using (
    user_id = auth.uid()
    or public.is_classroom_member(classroom_id)
    or public.owns_classroom(classroom_id)
  );

create policy classroom_members_insert_student
  on public.classroom_members for insert
  with check (
    user_id = auth.uid()
    and public.is_student()
  );

-- ---------------------------------------------------------------------------
-- groups
-- ---------------------------------------------------------------------------
create policy groups_select
  on public.groups for select
  using (
    public.is_classroom_member(classroom_id)
    or public.owns_classroom(classroom_id)
  );

create policy groups_insert_officer
  on public.groups for insert
  with check (public.owns_classroom(classroom_id));

create policy groups_update_officer
  on public.groups for update
  using (public.owns_classroom(classroom_id))
  with check (public.owns_classroom(classroom_id));

create policy groups_delete_officer
  on public.groups for delete
  using (public.owns_classroom(classroom_id));

-- ---------------------------------------------------------------------------
-- group_members
-- ---------------------------------------------------------------------------
create policy group_members_select
  on public.group_members for select
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.groups g
      where g.id = group_members.group_id
        and (
          public.is_classroom_member(g.classroom_id)
          or public.owns_classroom(g.classroom_id)
        )
    )
  );

create policy group_members_manage_officer
  on public.group_members for all
  using (
    exists (
      select 1
      from public.groups g
      where g.id = group_members.group_id
        and public.owns_classroom(g.classroom_id)
    )
  )
  with check (
    exists (
      select 1
      from public.groups g
      where g.id = group_members.group_id
        and public.owns_classroom(g.classroom_id)
    )
  );

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
create policy tasks_select
  on public.tasks for select
  using (
    exists (
      select 1
      from public.groups g
      where g.id = tasks.group_id
        and (
          public.is_classroom_member(g.classroom_id)
          or public.owns_classroom(g.classroom_id)
        )
    )
  );

create policy tasks_manage_officer
  on public.tasks for all
  using (
    exists (
      select 1
      from public.groups g
      where g.id = tasks.group_id
        and public.owns_classroom(g.classroom_id)
    )
  )
  with check (
    exists (
      select 1
      from public.groups g
      where g.id = tasks.group_id
        and public.owns_classroom(g.classroom_id)
    )
  );

create policy tasks_update_assignee
  on public.tasks for update
  using (assigned_to = auth.uid() and public.is_student())
  with check (assigned_to = auth.uid() and public.is_student());

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create policy notifications_select_own
  on public.notifications for select
  using (user_id = auth.uid());

create policy notifications_update_own
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
