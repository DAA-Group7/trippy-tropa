-- Allow classroom creation before auth is fully wired (optional officer id)
alter table public.classrooms
  alter column created_by drop not null;

-- Dev-friendly policies — tighten for production
create policy "Anyone can read classrooms by invite"
  on public.classrooms for select
  using (true);

create policy "Authenticated and anon can create classrooms"
  on public.classrooms for insert
  with check (true);
