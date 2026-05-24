-- Per-classroom onboarding metrics with multipliers (GAP-F-020)

create table public.classroom_skill_templates (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  metric_key text not null
    check (metric_key ~ '^[a-z][a-z0-9_]{0,47}$'),
  label text not null check (char_length(trim(label)) between 1 and 80),
  description text,
  tooltip text,
  multiplier numeric(5, 2) not null default 1.0
    check (multiplier > 0 and multiplier <= 10),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (classroom_id, metric_key)
);

create index classroom_skill_templates_classroom_idx
  on public.classroom_skill_templates (classroom_id, sort_order);

create table public.student_classroom_skill_ratings (
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  template_id uuid not null references public.classroom_skill_templates (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key (classroom_id, user_id, template_id)
);

create index student_classroom_skill_ratings_user_idx
  on public.student_classroom_skill_ratings (user_id, classroom_id);

alter table public.classroom_members
  add column if not exists skills_assessed_at timestamptz;

alter table public.classroom_skill_templates enable row level security;
alter table public.student_classroom_skill_ratings enable row level security;

-- Templates: classroom officer read/write; members read for their classroom
create policy classroom_skill_templates_select
  on public.classroom_skill_templates for select
  using (
    public.owns_classroom(classroom_id)
    or public.is_classroom_member(classroom_id)
  );

create policy classroom_skill_templates_insert_officer
  on public.classroom_skill_templates for insert
  with check (public.owns_classroom(classroom_id));

create policy classroom_skill_templates_update_officer
  on public.classroom_skill_templates for update
  using (public.owns_classroom(classroom_id))
  with check (public.owns_classroom(classroom_id));

create policy classroom_skill_templates_delete_officer
  on public.classroom_skill_templates for delete
  using (public.owns_classroom(classroom_id));

-- Ratings: students manage own; officer reads classroom
create policy student_classroom_skill_ratings_select
  on public.student_classroom_skill_ratings for select
  using (
    public.owns_classroom(classroom_id)
    or user_id = auth.uid()
  );

create policy student_classroom_skill_ratings_insert_own
  on public.student_classroom_skill_ratings for insert
  with check (
    user_id = auth.uid()
    and public.is_classroom_member(classroom_id)
    and exists (
      select 1
      from public.classroom_skill_templates t
      where t.id = student_classroom_skill_ratings.template_id
        and t.classroom_id = student_classroom_skill_ratings.classroom_id
    )
  );

create policy student_classroom_skill_ratings_update_own
  on public.student_classroom_skill_ratings for update
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and public.is_classroom_member(classroom_id)
  );
