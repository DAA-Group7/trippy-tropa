-- CollabClass initial schema
-- Run via Supabase SQL editor or: supabase db push

-- Profiles (extends auth.users)
create type public.user_role as enum ('officer', 'student');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role public.user_role not null default 'student',
  skills_completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.skill_ratings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  communication smallint not null check (communication between 1 and 5),
  leadership smallint not null check (leadership between 1 and 5),
  technical smallint not null check (technical between 1 and 5),
  teamwork smallint not null check (teamwork between 1 and 5),
  updated_at timestamptz not null default now()
);

create table public.classrooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text,
  invite_code text not null unique,
  max_groups int not null default 8,
  rules text,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.classroom_members (
  classroom_id uuid references public.classrooms (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (classroom_id, user_id)
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  name text not null,
  leader_id uuid references public.profiles (id),
  progress_status text not null default 'not_started',
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid references public.groups (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  primary key (group_id, user_id)
);

create type public.task_status as enum ('todo', 'in_progress', 'review', 'done');

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  title text not null,
  description text,
  status public.task_status not null default 'todo',
  assigned_to uuid references public.profiles (id),
  deadline timestamptz,
  estimated_hours numeric(5, 2),
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- RLS (enable and add policies per role in a follow-up migration)
alter table public.profiles enable row level security;
alter table public.classrooms enable row level security;
alter table public.groups enable row level security;
alter table public.tasks enable row level security;
