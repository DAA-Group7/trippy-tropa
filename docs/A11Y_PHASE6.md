# Phase 6 accessibility audit (static review)

## Fixed in this phase

- **Skip link** — `SkipToContent` on student and officer layouts targets `#main-content`
- **Landmarks** — `<main id="main-content">` in both shells; mobile nav `aria-label`
- **Group chat** — labeled composer (`sr-only` + `id`), `role="log"` + `aria-live="polite"` for new messages
- **Officer search** — `aria-label` on dashboard search input
- **Student dashboard** — disabled search control labeled as coming soon; profile image `alt` text
- **Progress bar** — `role="progressbar"` with `aria-valuenow` on group workspace
- **Officer profile** — sidebar uses session name/email instead of hardcoded “Dr. Smith”
- **Focus** — primary buttons/inputs use `focus-visible:ring` via `stitch` token classes

## Remaining gaps (future work)

- **Kanban drag-and-drop** — no keyboard alternative for moving cards
- **Heading levels** — some pages use multiple `h1`-equivalent sizes without strict `h1` → `h2` hierarchy
- **Notification badge** — mobile nav dot is decorative only (not tied to unread count)
- **Color contrast** — run automated contrast check on `#505f76` on `#faf8ff` in production build

## Manual test checklist

1. Tab from page load — skip link appears and moves focus to main content
2. Tab through group chat — reach message field and Send with visible focus ring
3. Screen reader — new chat message announced via live region (second browser/tab)
4. Mobile — bottom nav reachable; all items have text labels (Home, Classes, Updates)
