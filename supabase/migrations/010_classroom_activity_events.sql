-- Classroom activity feed for officer dashboards (GAP-F-006)

create type public.classroom_activity_event_type as enum (
  'enrolled',
  'groups_published',
  'task_created',
  'task_deleted',
  'assignment_run'
);

create table public.classroom_activity_events (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  event_type public.classroom_activity_event_type not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index classroom_activity_events_classroom_created_idx
  on public.classroom_activity_events (classroom_id, created_at desc);

create index classroom_activity_events_created_idx
  on public.classroom_activity_events (created_at desc);

alter table public.classroom_activity_events enable row level security;

create policy classroom_activity_events_select_officer
  on public.classroom_activity_events for select
  using (public.owns_classroom(classroom_id));

create policy classroom_activity_events_insert_officer
  on public.classroom_activity_events for insert
  with check (
    public.is_officer()
    and public.owns_classroom(classroom_id)
    and (actor_id is null or actor_id = auth.uid())
  );

create policy classroom_activity_events_insert_student_enrolled
  on public.classroom_activity_events for insert
  with check (
    public.is_student()
    and event_type = 'enrolled'::public.classroom_activity_event_type
    and actor_id = auth.uid()
    and public.is_classroom_member(classroom_id)
  );
