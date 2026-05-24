-- Track task status changes for participation metrics (GAP-F-018)

alter table public.tasks
  add column if not exists updated_at timestamptz not null default now();

update public.tasks
set updated_at = created_at
where updated_at is null;

create index if not exists tasks_updated_at_idx
  on public.tasks (updated_at desc);
