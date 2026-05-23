-- Task skill requirements and assignment metadata for auto-assign

alter table public.tasks
  add column if not exists required_skills jsonb not null default '{}'::jsonb,
  add column if not exists assignment_match_score smallint,
  add column if not exists assignment_reason text;

comment on column public.tasks.required_skills is
  'Weighted skill keys for task-assigner, e.g. {"technical": 5, "communication": 2}';

comment on column public.tasks.assignment_match_score is
  'Match percentage (0-100) from last auto-assign run';

comment on column public.tasks.assignment_reason is
  'Human-readable rationale from last auto-assign run';
