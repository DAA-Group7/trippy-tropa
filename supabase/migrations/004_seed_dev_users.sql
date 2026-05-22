-- Dev seed users (officer + student). Safe to re-run (skips if email exists).
-- Run in Supabase SQL Editor or: supabase db push
--
-- Credentials (development only — change in production):
--   Officer: officer@trippy-tropa.dev  /  Officer123!
--   Student: student@trippy-tropa.dev  /  Student123!

create extension if not exists pgcrypto;

do $$
declare
  inst_id uuid;
  officer_id uuid := 'a0000000-0000-4000-8000-000000000001';
  student_id uuid := 'a0000000-0000-4000-8000-000000000002';
  officer_email text := 'officer@trippy-tropa.dev';
  student_email text := 'student@trippy-tropa.dev';
begin
  select id into inst_id from auth.instances limit 1;
  if inst_id is null then
    inst_id := '00000000-0000-0000-0000-000000000000';
  end if;

  -- Officer account
  if not exists (select 1 from auth.users where email = officer_email) then
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) values (
      inst_id,
      officer_id,
      'authenticated',
      'authenticated',
      officer_email,
      crypt('Officer123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"],"seed":true}'::jsonb,
      '{"full_name":"Dr. Smith","role":"officer"}'::jsonb,
      now(),
      now()
    );

    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      gen_random_uuid(),
      officer_id,
      jsonb_build_object('sub', officer_id::text, 'email', officer_email),
      'email',
      officer_id::text,
      now(),
      now(),
      now()
    );
  end if;

  -- Student account
  if not exists (select 1 from auth.users where email = student_email) then
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) values (
      inst_id,
      student_id,
      'authenticated',
      'authenticated',
      student_email,
      crypt('Student123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"],"seed":true}'::jsonb,
      '{"full_name":"Alex Student","role":"student"}'::jsonb,
      now(),
      now()
    );

    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      gen_random_uuid(),
      student_id,
      jsonb_build_object('sub', student_id::text, 'email', student_email),
      'email',
      student_id::text,
      now(),
      now(),
      now()
    );
  end if;

  -- Ensure profiles exist (trigger may have run; keep roles in sync)
  insert into public.profiles (id, email, full_name, role, skills_completed)
  values
    (officer_id, officer_email, 'Dr. Smith', 'officer'::public.user_role, true),
    (student_id, student_email, 'Alex Student', 'student'::public.user_role, false)
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role,
    skills_completed = excluded.skills_completed;
end;
$$;
