-- Manual assignment overrides and audit trail (GAP-F-016)

alter type public.classroom_activity_event_type
  add value if not exists 'assignment_override';

create table public.assignment_audit (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  from_student_id uuid references public.profiles (id) on delete set null,
  to_student_id uuid not null references public.profiles (id) on delete cascade,
  changed_by uuid not null references public.profiles (id) on delete cascade,
  reason text check (reason is null or char_length(trim(reason)) <= 500),
  created_at timestamptz not null default now()
);

create index assignment_audit_task_created_idx
  on public.assignment_audit (task_id, created_at desc);

alter table public.assignment_audit enable row level security;

create policy assignment_audit_select_officer
  on public.assignment_audit for select
  using (
    exists (
      select 1
      from public.tasks t
      join public.groups g on g.id = t.group_id
      where t.id = assignment_audit.task_id
        and public.owns_classroom(g.classroom_id)
    )
  );

create policy assignment_audit_insert_officer
  on public.assignment_audit for insert
  with check (
    changed_by = auth.uid()
    and public.is_officer()
    and exists (
      select 1
      from public.tasks t
      join public.groups g on g.id = t.group_id
      where t.id = assignment_audit.task_id
        and public.owns_classroom(g.classroom_id)
    )
  );
