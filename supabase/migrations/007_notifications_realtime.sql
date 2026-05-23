-- Notifications metadata, insert policies, and Realtime publication

create type public.notification_kind as enum (
  'group_assigned',
  'task_assigned',
  'task_updated',
  'classroom_joined',
  'deadline'
);

alter table public.notifications
  add column if not exists kind public.notification_kind not null default 'task_updated',
  add column if not exists related_id uuid,
  add column if not exists classroom_id uuid references public.classrooms (id) on delete set null;

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

-- Users can create notifications for themselves (e.g. enrollment confirmation)
create policy notifications_insert_self
  on public.notifications for insert
  with check (user_id = auth.uid());

-- Officers can create notifications for students in classrooms they own
create policy notifications_insert_officer
  on public.notifications for insert
  with check (
    public.is_officer()
    and exists (
      select 1
      from public.classroom_members cm
      join public.classrooms c on c.id = cm.classroom_id
      where cm.user_id = notifications.user_id
        and c.created_by = auth.uid()
        and (
          notifications.classroom_id is null
          or notifications.classroom_id = c.id
        )
    )
  );

-- Students can notify peers in the same group (e.g. task status updates)
create policy notifications_insert_student_group_peer
  on public.notifications for insert
  with check (
    public.is_student()
    and notifications.user_id <> auth.uid()
    and exists (
      select 1
      from public.group_members gm_self
      join public.group_members gm_target
        on gm_self.group_id = gm_target.group_id
      where gm_self.user_id = auth.uid()
        and gm_target.user_id = notifications.user_id
    )
  );

-- Students can notify the officer who owns a classroom they belong to
create policy notifications_insert_student_to_officer
  on public.notifications for insert
  with check (
    public.is_student()
    and exists (
      select 1
      from public.classrooms c
      join public.classroom_members cm on cm.classroom_id = c.id
      where cm.user_id = auth.uid()
        and c.created_by = notifications.user_id
        and (
          notifications.classroom_id is null
          or notifications.classroom_id = c.id
        )
    )
  );

-- Enable Realtime (idempotent)
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.tasks;
exception
  when duplicate_object then null;
end $$;
