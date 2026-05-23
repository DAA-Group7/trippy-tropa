-- Group chat messages and Realtime

create table public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index group_messages_group_created_idx
  on public.group_messages (group_id, created_at desc);

alter table public.group_messages enable row level security;

-- Members of the group or classroom officer can read messages
create policy group_messages_select
  on public.group_messages for select
  using (
    exists (
      select 1
      from public.group_members gm
      where gm.group_id = group_messages.group_id
        and gm.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.groups g
      where g.id = group_messages.group_id
        and public.owns_classroom(g.classroom_id)
    )
  );

-- Only group members can post
create policy group_messages_insert_member
  on public.group_messages for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.group_members gm
      where gm.group_id = group_messages.group_id
        and gm.user_id = auth.uid()
    )
  );

do $$
begin
  alter publication supabase_realtime add table public.group_messages;
exception
  when duplicate_object then null;
end $$;
