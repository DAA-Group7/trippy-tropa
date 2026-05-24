# How auto-assign works (greedy matching)

This guide explains what Trippy-Tropa does when an instructor clicks **Auto assign** on the task management screen. It is written for people running a class, not only for engineers.

Implementation: [`src/lib/algorithms/task-assigner.ts`](../../src/lib/algorithms/task-assigner.ts)

---

## In one sentence

For each task, the system picks the **group member who fits the required skills best** among students who still have enough **time budget** left, based on hours they entered in the **time estimate matrix**.

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

The **40-hour** default is a simple class-wide capacity for one assignment run. Hours from tasks already assigned in the same run are subtracted so load spreads across people.

---

## Step-by-step (per group)

Auto-assign runs **separately for each group**. Inside a group:

1. **List tasks** to assign (only unassigned tasks unless you choose **Reassign all**).
2. **Take tasks one at a time**, in database order.
3. For the current task, look at every member who:
   - entered a time estimate for that task, and
   - still has at least that many hours left in their budget.
4. **Score** each eligible member by skill fit (see below).
5. **Assign** the task to whoever scores highest.
6. **Subtract** that task’s estimated hours from that student’s remaining budget.
7. Move to the next task.

That “pick the best available person, then move on” pattern is called a **greedy** algorithm: it makes a good local choice each time without trying every possible combination of all tasks and all students.

---

## How skill fit is calculated (plain language)

Each task can require one or more skills with weights (1 = nice to have, 5 = essential).

For each student, the system compares their rating (1–5) on each required skill to what the task asks for. Stronger students on heavily weighted skills score higher.

The result is shown as a **match %** (0–100) in the assignment matrix and on overrides. Example: a task marked **Technical (4)** will favor a student rated 5 on Technical over one rated 2.

If a task has **no** required skills, everyone is treated as an equal 100% skill match; hours and budget still decide who gets it.

---

## Auto assign vs Reassign all

| Button | Behavior |
|--------|----------|
| **Auto assign** | Only tasks with **no assignee** are filled. Existing assignments stay as they are. |
| **Reassign all** | Re-runs matching for **every** task in the classroom. Current assignees **may change**. Use after estimates update or if you want a fresh pass. |

You can always **override** a single task manually; that choice is logged and the student is notified.

---

## Limitations (important)

- **Not guaranteed to be perfect.** Because tasks are handled one-by-one, an early assignment can use up someone’s hours so they miss a later task they would have been ideal for. A different order could produce a different result.
- **Task order matters.** The order tasks are processed affects who is still available later.
- **No estimate → no assignment.** If nobody in the group estimated hours for a task, it stays unassigned.
- **Capacity is simplified.** The 40-hour cap is a planning aid, not a real calendar. It does not know holidays, exams, or other classes.
- **Skills are summaries.** Ratings are self-reported and may not reflect real-world performance.
- **Greedy is fast, not optimal.** For very large classes you get answers in seconds; a future **Hungarian** (optimal) matcher may be offered as an alternative (see GAP-A-002).

When fairness or nuance matters more than automation, use **manual override** after auto-assign.

---

## How fast is it?

For typical class sizes (on the order of tens of students and tens of tasks per group), auto-assign completes in well under a second per group on the server.

Rough complexity: for each task, every student in the group may be checked once — **O(tasks × students)** per group. That scales comfortably for normal classroom use.

---

## Tips for instructors

- Set **required skills** on tasks you care about matching; leave them empty for generic work.
- Wait for the **time matrix** before auto-assign so hours are realistic.
- Review the **assignment matrix** heatmap after running auto-assign.
- Use **Reassign all** sparingly; confirm with your class if assignees might change mid-project.
- Override individual tasks when you know something the algorithm cannot (absences, roles, equity).

---

## Related documentation

- Time estimates: student **Time estimates** tab in the group workspace.
- Manual override: **Reassign** on a task row + optional reason (audit log).
- Code entry point: `assignTasksOptimally()` in `task-assigner.ts`, called from `autoAssignTasks()` in `tasks.ts`.
