-- Student self-reported hours per task (group time estimate matrix)

create table public.task_time_estimates (
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  estimated_hours numeric(6, 2) not null
    check (estimated_hours > 0 and estimated_hours <= 200),
  updated_at timestamptz not null default now(),
  primary key (task_id, user_id)
);

create index task_time_estimates_task_idx
  on public.task_time_estimates (task_id);

alter table public.task_time_estimates enable row level security;

-- Group members and classroom officers can read estimates for tasks in scope
create policy task_time_estimates_select
  on public.task_time_estimates for select
  using (
    exists (
      select 1
      from public.tasks t
      join public.groups g on g.id = t.group_id
      where t.id = task_time_estimates.task_id
        and (
          public.owns_classroom(g.classroom_id)
          or exists (
            select 1
            from public.group_members gm
            where gm.group_id = g.id
              and gm.user_id = auth.uid()
          )
        )
    )
  );

-- Group members may insert their own estimate for a task in their group
create policy task_time_estimates_insert_own
  on public.task_time_estimates for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.tasks t
      join public.group_members gm on gm.group_id = t.group_id
      where t.id = task_time_estimates.task_id
        and gm.user_id = auth.uid()
    )
  );

-- Group members may update their own estimate
create policy task_time_estimates_update_own
  on public.task_time_estimates for update
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.tasks t
      join public.group_members gm on gm.group_id = t.group_id
      where t.id = task_time_estimates.task_id
        and gm.user_id = auth.uid()
    )
  );
