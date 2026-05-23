# Development seed users

Apply migrations **001 → 002 → 003 → 004** in order (SQL Editor or `supabase db push`).

If login shows **"Database error querying schema"**, run migration `005_fix_auth_users_tokens.sql` (`supabase db push`). This fixes NULL token columns on seeded `auth.users` rows.

If `004` failed with `gen_salt does not exist`, pull the latest `004_seed_dev_users.sql` (uses `extensions.gen_salt`) and run:

```bash
supabase db push
```

Or paste the contents of `004_seed_dev_users.sql` into the Supabase SQL Editor and run once.

| Role    | Email                     | Password     |
|---------|---------------------------|--------------|
| Officer | `officer@trippy-tropa.dev` | `Officer123!` |
| Student | `student@trippy-tropa.dev` | `Student123!` |

- **Officer** → `/officer/dashboard` (skills marked complete in seed)
- **Student** → `/onboarding/skills` first, then `/student/dashboard` after assessment

Self-registration always creates **student** accounts. Officer accounts are created via seed or service role only.

**Do not use these passwords in production.**
