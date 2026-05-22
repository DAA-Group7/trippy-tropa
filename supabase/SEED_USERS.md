# Development seed users

Apply migrations **001 → 002 → 003 → 004** in order (SQL Editor or `supabase db push`).

| Role    | Email                     | Password     |
|---------|---------------------------|--------------|
| Officer | `officer@trippy-tropa.dev` | `Officer123!` |
| Student | `student@trippy-tropa.dev` | `Student123!` |

- **Officer** → `/officer/dashboard` (skills marked complete in seed)
- **Student** → `/onboarding/skills` first, then `/student/dashboard` after assessment

Self-registration always creates **student** accounts. Officer accounts are created via seed or service role only.

**Do not use these passwords in production.**
