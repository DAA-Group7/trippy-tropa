-- Rich demo data: classroom, extra students, groups, tasks, chat, notifications
-- Requires 004 (dev users), 006 (task skills), 007 (notification kinds), 008 (group_messages)
-- Safe to re-run (idempotent on fixed UUIDs)

create extension if not exists pgcrypto with schema extensions;

do $$
declare
  inst_id uuid;
  officer_id uuid := 'a0000000-0000-4000-8000-000000000001';
  student_id uuid := 'a0000000-0000-4000-8000-000000000002';
  student2_id uuid := 'a0000000-0000-4000-8000-000000000003';
  student3_id uuid := 'a0000000-0000-4000-8000-000000000004';
  classroom_id uuid := 'b0000000-0000-4000-8000-000000000001';
  group1_id uuid := 'c0000000-0000-4000-8000-000000000001';
  group2_id uuid := 'c0000000-0000-4000-8000-000000000002';
  pw text := extensions.crypt('Student123!', extensions.gen_salt('bf'));
begin
  select id into inst_id from auth.instances limit 1;
  if inst_id is null then
    inst_id := '00000000-0000-0000-0000-000000000000';
  end if;

  -- Extra demo students
  if not exists (select 1 from auth.users where email = 'jordan@trippy-tropa.dev') then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_token, recovery_token,
      email_change_token_new, email_change,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      inst_id, student2_id, 'authenticated', 'authenticated',
      'jordan@trippy-tropa.dev', pw, now(), '', '', '', '',
      '{"provider":"email","providers":["email"],"seed":true}'::jsonb,
      '{"full_name":"Jordan Lee","role":"student"}'::jsonb, now(), now()
    );
    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), student2_id,
      jsonb_build_object('sub', student2_id::text, 'email', 'jordan@trippy-tropa.dev'),
      'email', student2_id::text, now(), now(), now()
    );
  end if;

  if not exists (select 1 from auth.users where email = 'sam@trippy-tropa.dev') then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_token, recovery_token,
      email_change_token_new, email_change,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      inst_id, student3_id, 'authenticated', 'authenticated',
      'sam@trippy-tropa.dev', pw, now(), '', '', '', '',
      '{"provider":"email","providers":["email"],"seed":true}'::jsonb,
      '{"full_name":"Sam Rivera","role":"student"}'::jsonb, now(), now()
    );
    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), student3_id,
      jsonb_build_object('sub', student3_id::text, 'email', 'sam@trippy-tropa.dev'),
      'email', student3_id::text, now(), now(), now()
    );
  end if;

  insert into public.profiles (id, email, full_name, role, skills_completed)
  values
    (student2_id, 'jordan@trippy-tropa.dev', 'Jordan Lee', 'student', true),
    (student3_id, 'sam@trippy-tropa.dev', 'Sam Rivera', 'student', true)
  on conflict (id) do update
  set full_name = excluded.full_name, skills_completed = true;

  update public.profiles
  set skills_completed = true
  where id in (student_id, student2_id, student3_id);

  insert into public.skill_ratings (user_id, communication, leadership, technical, teamwork)
  values
    (student_id, 4, 3, 5, 4),
    (student2_id, 5, 4, 3, 4),
    (student3_id, 3, 5, 4, 5)
  on conflict (user_id) do update
  set
    communication = excluded.communication,
    leadership = excluded.leadership,
    technical = excluded.technical,
    teamwork = excluded.teamwork,
    updated_at = now();

  insert into public.classrooms (id, name, subject, invite_code, max_groups, created_by)
  values (
    classroom_id,
    'CS 301 — Software Engineering',
    'CS 301',
    'DEMO2026',
    4,
    officer_id
  )
  on conflict (id) do nothing;

  insert into public.classroom_members (classroom_id, user_id)
  values
    (classroom_id, student_id),
    (classroom_id, student2_id),
    (classroom_id, student3_id)
  on conflict do nothing;

  delete from public.group_messages
  where group_id in (select id from public.groups where classroom_id = classroom_id);
  delete from public.tasks
  where group_id in (select id from public.groups where classroom_id = classroom_id);
  delete from public.group_members
  where group_id in (select id from public.groups where classroom_id = classroom_id);
  delete from public.groups where classroom_id = classroom_id;

  insert into public.groups (id, classroom_id, name, leader_id, progress_status)
  values
    (group1_id, classroom_id, 'Team Alpha', student_id, 'in_progress'),
    (group2_id, classroom_id, 'Team Beta', student3_id, 'not_started');

  insert into public.group_members (group_id, user_id)
  values
    (group1_id, student_id),
    (group1_id, student2_id),
    (group2_id, student3_id)
  on conflict do nothing;

  insert into public.tasks (
    group_id, title, description, status, assigned_to,
    estimated_hours, required_skills, assignment_match_score, assignment_reason
  )
  values
    (
      group1_id, 'API contract draft', 'Define REST endpoints for the milestone',
      'in_progress', student_id, 6,
      '{"technical": 4, "communication": 3}'::jsonb, 88,
      'Strong technical fit with available hours'
    ),
    (
      group1_id, 'Sprint retrospective', 'Facilitate retro and capture action items',
      'todo', student2_id, 2,
      '{"communication": 4, "teamwork": 4}'::jsonb, 92,
      'Best match for communication and teamwork'
    ),
    (
      group1_id, 'Integration tests', 'Cover auth and classroom flows',
      'review', student_id, 8,
      '{"technical": 5}'::jsonb, 85,
      'Highest technical score in group'
    ),
    (
      group2_id, 'Wireframe review', 'Review Stitch screens with the team',
      'todo', student3_id, 3,
      '{"communication": 3, "teamwork": 3}'::jsonb, 90,
      'Leadership and teamwork balance'
    ),
    (
      group2_id, 'Deploy staging', 'Ship preview to Vercel',
      'done', student3_id, 4,
      '{"technical": 4}'::jsonb, 87,
      'Technical lead on Team Beta'
    );

  insert into public.group_messages (group_id, user_id, body, created_at)
  values
    (
      group1_id, student_id,
      'I pushed the OpenAPI draft — please review sections 2–4.',
      now() - interval '2 hours'
    ),
    (
      group1_id, student2_id,
      'On it. I will add error response examples tonight.',
      now() - interval '90 minutes'
    ),
    (
      group1_id, student_id,
      'Retro is Thursday 3pm. Bring one win and one blocker.',
      now() - interval '30 minutes'
    ),
    (
      group2_id, student3_id,
      'Sam here — wireframes are in Figma, link in the task board.',
      now() - interval '3 hours'
    ),
    (
      group2_id, student3_id,
      'Next up: deployment checklist before Friday.',
      now() - interval '1 hour'
    );

  delete from public.notifications n
  where n.classroom_id = classroom_id
    and n.user_id in (student_id, officer_id);

  insert into public.notifications (user_id, title, body, kind, classroom_id, read)
  values
    (
      student_id,
      'Assigned to Team Alpha',
      'Your instructor published groups for CS 301.',
      'group_assigned', classroom_id, true
    ),
    (
      student_id,
      'New task: API contract draft',
      'Auto-assigned based on your skills.',
      'task_assigned', classroom_id, false
    ),
    (
      officer_id,
      'New student enrolled',
      'Students joined CS 301 — Software Engineering.',
      'classroom_joined', classroom_id, false
    );
end;
$$;
