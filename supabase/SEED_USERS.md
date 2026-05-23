# Development seed users

Apply migrations **001 → 009** in order (SQL Editor or `supabase db push`).

If login shows **"Database error querying schema"**, run migration `005_fix_auth_users_tokens.sql`.

If `004` failed with `gen_salt does not exist`, use the latest `004_seed_dev_users.sql` (uses `extensions.gen_salt`).

## Accounts

| Role    | Email                     | Password     |
|---------|---------------------------|--------------|
| Officer | `officer@trippy-tropa.dev` | `Officer123!` |
| Student | `student@trippy-tropa.dev` | `Student123!` |
| Student | `jordan@trippy-tropa.dev`  | `Student123!` |
| Student | `sam@trippy-tropa.dev`     | `Student123!` |

## Demo classroom (migration 009)

After `009_seed_demo_data.sql`:

- **Classroom:** CS 301 — Software Engineering
- **Invite code:** `DEMO2026`
- **Groups:** Team Alpha (Alex + Jordan), Team Beta (Sam)
- **Includes:** skill ratings, tasks, notifications, group chat messages

**Quick student path**

1. Log in as `student@trippy-tropa.dev` / `Student123!`
2. Complete onboarding skills if prompted (seed sets `skills_completed` on re-run of 009)
3. Open dashboard — classroom card links to group workspace with live chat
4. Or join manually with invite code `DEMO2026`

**Officer path**

1. Log in as `officer@trippy-tropa.dev` / `Officer123!`
2. Dashboard shows the demo classroom, groups, and tasks

Self-registration always creates **student** accounts. Officer accounts are created via seed or service role only.

**Do not use these passwords in production.**
