# How auto-assign works (Hungarian matching)

This guide explains what Trippy-Tropa does when an instructor clicks **Auto assign** on the task management screen. It is written for people running a class, not only for engineers.

> **Note:** The file name is kept for older links. Auto-assign now uses the **Hungarian algorithm**, not the earlier greedy “pick best task one-by-one” approach.

Implementation: [`src/lib/algorithms/hungarian-assigner.ts`](../../src/lib/algorithms/hungarian-assigner.ts), [`src/lib/algorithms/hungarian.ts`](../../src/lib/algorithms/hungarian.ts)

---

## In one sentence

For each group, the system repeatedly finds the **best overall pairing** of tasks and members (who still have time budget left), using the **Hungarian algorithm**, based on skill fit and hours from the **time estimate matrix**.

---

## What you need before auto-assign

1. **Groups are published** — each student belongs to a group.
2. **Students finished skill onboarding** — ratings exist (global or per-classroom).
3. **Time estimate matrix is complete** (when your class uses it) — every group member has entered how many hours **they** expect each task to take **for themselves**. Auto-assign is blocked until that grid is filled.
4. **Tasks exist** with optional **required skills** (e.g. Technical 4) set when you create the task.

If any student never estimated hours for a task, nobody can be auto-assigned to that task.

---

## What the system looks at

| Input | Where it comes from | Role |
|--------|---------------------|------|
| Required skills | Task settings (primary skill + weight 1–5) | Defines what “good fit” means |
| Student skills | Onboarding / classroom skill assessment | Compared to required skills |
| Hours per task | Student time estimate matrix | Must be &gt; 0 to be eligible |
| Remaining hours | Starts at **40 hours** per student per run | Prevents one person taking everything |

The **40-hour** default is a simple class-wide capacity for one assignment run. Hours from tasks already assigned in the same run are subtracted so load can spread across people.

---

## How the Hungarian matcher works (plain language)

Auto-assign runs **separately for each group**.

Inside a group, the system runs **one or more matching rounds**:

1. **List tasks** still waiting for an assignee (only unassigned tasks unless you choose **Reassign all**).
2. Build a table of every **remaining task × every member** who:
   - entered a time estimate for that task, and
   - still has at least that many hours left in their budget.
3. For each valid pair, compute a **cost** from skill fit (lower cost = better match).
4. Run the **Hungarian algorithm** to find the pairing that **minimizes total cost** — i.e. maximizes overall skill fit for that round, without assigning the same person twice in the same round.
5. Apply those assignments, subtract hours from each student’s budget, and remove those tasks from the list.
6. **Repeat** until no more valid pairings remain.

### Why “rounds”?

Each student can receive **more than one task** if their hour budget allows. A single Hungarian run only assigns **at most one task per student**. So after a round finishes, the system starts another round with the remaining tasks and updated budgets.

That is still stronger than the old greedy method, which chose tasks **in a fixed order** and could lock in a weak match early. Each Hungarian round optimizes the **whole batch** of remaining tasks and available members together.

---

## How skill fit is calculated

Each task can require one or more skills with weights (1 = nice to have, 5 = essential).

For each student, the system compares their rating (1–5) on each required skill to what the task asks for. Stronger students on heavily weighted skills score higher.

The result is shown as a **match %** (0–100) in the assignment matrix. If a task has **no** required skills, everyone is treated as an equal skill match; hours and budget still decide who gets it.

---

## Auto assign vs Reassign all

| Button | Behavior |
|--------|----------|
| **Auto assign** | Only tasks with **no assignee** are filled. Existing assignments stay as they are. |
| **Reassign all** | Re-runs matching for **every** task in the classroom. Current assignees **may change**. Use after estimates update or if you want a fresh pass. |

You can always **override** a single task manually; that choice is logged and the student is notified.

---

## Limitations (important)

- **Multiple rounds, not one giant solve.** Each round is optimal for that batch, but later rounds see a smaller set of tasks and tighter budgets. This is a practical way to respect hour limits while still using Hungarian matching.
- **No estimate → no assignment.** If nobody in the group estimated hours for a task, it stays unassigned.
- **Capacity is simplified.** The 40-hour cap is a planning aid, not a real calendar.
- **Skills are summaries.** Ratings are self-reported and may not capture everything you know about a student.
- **Very large groups** (hundreds of tasks × members per round) may take longer, but typical class sizes finish quickly.

When fairness or nuance matters more than automation, use **manual override** after auto-assign.

---

## How fast is it?

For typical class sizes (on the order of tens of students and tasks per group), auto-assign still completes in well under a second per group on the server.

Each Hungarian round is roughly **O(n³)** in the size of that round’s matrix (tasks and members padded to a square). Classroom-sized groups are well within normal limits.

---

## Tips for instructors

- Set **required skills** on tasks you care about matching; leave them empty for generic work.
- Wait for the **time matrix** before auto-assign so hours are realistic.
- Review the **assignment matrix** heatmap after running auto-assign.
- Use **Reassign all** sparingly; confirm with your class if assignees might change mid-project.
- Override individual tasks when you know something the system cannot (absences, roles, equity).

---

## Related documentation

- Time estimates: student **Time estimates** tab in the group workspace.
- Manual override: **Reassign** on a task row + optional reason (audit log).
- Code: `assignTasksHungarian()` → `hungarianMinAssign()` in `hungarian.ts`, called from `autoAssignTasks()` in `tasks.ts`.
