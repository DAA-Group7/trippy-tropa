import type { SkillRatings } from "@/types/database";

export interface StudentWithSkills {
  id: string;
  name: string;
  skills: SkillRatings;
  /** Classroom-weighted skill total when custom metrics exist. */
  weightedTotal?: number;
}

export interface BalancedGroup {
  id: string;
  name: string;
  memberIds: string[];
  leaderId: string | null;
}

/**
 * Overall score used for group balancing.
 *
 * Prefer `weightedTotal` (classroom templates with multipliers) so balancing
 * matches what officers configured. Fall back to the sum of the four core skills.
 */
export function studentBalanceScore(student: StudentWithSkills): number {
  if (student.weightedTotal != null && student.weightedTotal > 0) {
    return student.weightedTotal;
  }
  return (
    student.skills.communication +
    student.skills.leadership +
    student.skills.technical +
    student.skills.teamwork
  );
}

export function groupTotalScore(
  memberIds: string[],
  studentsById: Map<string, StudentWithSkills>
): number {
  return memberIds.reduce((sum, id) => {
    const student = studentsById.get(id);
    return student ? sum + studentBalanceScore(student) : sum;
  }, 0);
}

function pickLowestLoadGroup(
  groups: BalancedGroup[],
  studentsById: Map<string, StudentWithSkills>
): BalancedGroup {
  let best = groups[0]!;

  for (const group of groups) {
    const total = groupTotalScore(group.memberIds, studentsById);
    const bestTotal = groupTotalScore(best.memberIds, studentsById);

    if (total < bestTotal) {
      best = group;
      continue;
    }

    if (total === bestTotal && group.memberIds.length < best.memberIds.length) {
      best = group;
    }
  }

  return best;
}

/**
 * Greedy load balancing (LPT-style):
 * 1. Sort students by balance score descending (strongest first).
 * 2. Assign each student to the group with the lowest current total score.
 * 3. Tie-break equal totals by smaller group size (keeps headcount even).
 *
 * @see docs/algorithms/greedy-group-balancing.md
 */
export function generateBalancedGroups(
  students: StudentWithSkills[],
  groupCount: number
): BalancedGroup[] {
  if (students.length === 0 || groupCount < 1) return [];

  const studentsById = new Map(students.map((s) => [s.id, s]));

  const sorted = [...students].sort(
    (a, b) => studentBalanceScore(b) - studentBalanceScore(a)
  );

  const groups: BalancedGroup[] = Array.from({ length: groupCount }, (_, i) => ({
    id: `group-${i + 1}`,
    name: `Group ${String.fromCharCode(65 + i)}`,
    memberIds: [],
    leaderId: null,
  }));

  for (const student of sorted) {
    const target = pickLowestLoadGroup(groups, studentsById);
    target.memberIds.push(student.id);
  }

  for (const group of groups) {
    const members = group.memberIds
      .map((id) => studentsById.get(id))
      .filter((s): s is StudentWithSkills => !!s);
    const leader = [...members].sort(
      (a, b) => b.skills.leadership - a.skills.leadership
    )[0];
    group.leaderId = leader?.id ?? null;
  }

  return groups;
}
