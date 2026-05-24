# How group balancing works (greedy load balancing)

This guide explains how Trippy-Tropa places students into groups when an officer clicks **Regenerate** on the group generation screen.

Implementation: [`src/lib/algorithms/group-balancer.ts`](../../src/lib/algorithms/group-balancer.ts)

---

## In one sentence

Students are sorted from **highest to lowest** overall skill score, then each student is placed into the group that currently has the **lowest total score** — a classic **greedy load balancing** approach.

---

## The three steps

1. **Score each student** with one number (their “overall skill / performance” score).
2. **Sort descending** — strongest students first.
3. **Assign one by one** to the group with the **lowest current total** (ties go to the smaller group).

After everyone is placed, each group’s **leader** is the member with the highest **leadership** rating (if auto-assign leader is on).

---

## What score do we sort by? (and why)

We use **`studentBalanceScore`**, in this order:

| Priority | Score | When |
|----------|--------|------|
| 1 | **Weighted classroom total** | The class uses custom skill metrics with multipliers (e.g. Technical ×2 for Software Engineering). |
| 2 | **Sum of four core skills** | Communication + leadership + technical + teamwork (each 1–5). |

### Why sort **highest first** (descending)?

This is the **Longest Processing Time (LPT)** idea from load balancing:

- Place the **heaviest** items (strongest students) first.
- Always put the next student on the **lightest** group (lowest total so far).

If you assigned **weakest** students first, several strong students might all land on the same “light” group at the end and undo the balance.

**Descending sort is the standard greedy choice** for minimizing the gap between the strongest and weakest group totals in classroom-sized rosters.

### Why not sort by average (mean) skill?

Average and sum rank students the **same way** when everyone has the same number of skills (four core, or the same template count). We use **sum / weighted total** because:

- It matches what we **accumulate per group** (totals, not averages).
- Classroom **multipliers** are already baked into `weightedTotal`.

### Why not sort by a single skill (e.g. leadership only)?

Leadership alone is useful for picking a **group leader**, not for **overall team strength**. Balancing on one dimension can put all “technical” students in one group even if they differ on everything else.

---

## How “lowest total score” works

For each group, add up the balance scores of everyone already in that group.

When placing the next student:

- Pick the group with the **smallest** total.
- If two groups tie, pick the one with **fewer members** (helps keep group sizes even when totals match).

Example with 2 groups and scores 18, 16, 14, 12, 10:

| Step | Student (score) | Group A total | Group B total | Placed in |
|------|-----------------|---------------|---------------|-----------|
| 1 | 18 | 0 | 0 | A (tie → smaller/equal) |
| 2 | 16 | 18 | 0 | B |
| 3 | 14 | 18 | 16 | B |
| 4 | 12 | 18 | 30 | A |
| 5 | 10 | 30 | 30 | A or B (tie-break by size) |

Final totals stay close because strong students were spread early.

---

## What this algorithm is good at

- **Fast** — linear in number of students × groups.
- **Easy to explain** to instructors and students.
- **Works well** for typical class sizes (roughly 12–40 students, 3–6 groups).
- **Aligns with custom classroom skills** when `weightedTotal` is set.

---

## Limitations (be honest)

- **Greedy, not perfect.** It does not try every possible partition; a different arrangement might sometimes look fairer on paper.
- **Order only matters through sort.** After sorting by score, placement is deterministic given ties rules.
- **Does not optimize for personality, friends, or schedule** — only skill totals (and optional weights).
- **Homogeneous / random strategies** in the UI dropdown are not implemented yet; only **Skill Balancing (Mixed)** uses this algorithm today.

Officers can **drag and drop** students between groups before publishing to fix anything the algorithm missed.

---

## Group leaders (separate step)

Balancing uses the **overall balance score**.

**Leader** selection uses **leadership** only — the highest leadership rating in each group when “Auto-assign group leader” is enabled. That is intentional: balance teams by total strength, then give each team a clear lead role.

---

## Related

- Task assignment (different problem): [`greedy-assignment.md`](greedy-assignment.md) / Hungarian auto-assign docs.
- Officer UI: `/officer/classrooms/[id]/groups/generate`
- Compare task matchers: [`greedy-vs-hunguarian-assignment.md`](greedy-vs-hunguarian-assignment.md)
