import type { SkillRatings } from "@/types/database";

export interface StudentWithSkills {
  id: string;
  name: string;
  skills: SkillRatings;
}

export interface BalancedGroup {
  id: string;
  name: string;
  memberIds: string[];
  leaderId: string | null;
}

/**
 * Greedy skill-balancing: distribute students to minimize variance
 * of total skill scores per group. Replace with advanced optimization later.
 */
export function generateBalancedGroups(
  students: StudentWithSkills[],
  groupCount: number
): BalancedGroup[] {
  if (students.length === 0 || groupCount < 1) return [];

  const skillSum = (s: StudentWithSkills) =>
    s.skills.communication +
    s.skills.leadership +
    s.skills.technical +
    s.skills.teamwork;

  const sorted = [...students].sort((a, b) => skillSum(b) - skillSum(a));
  const groups: BalancedGroup[] = Array.from({ length: groupCount }, (_, i) => ({
    id: `group-${i + 1}`,
    name: `Group ${String.fromCharCode(65 + i)}`,
    memberIds: [],
    leaderId: null,
  }));

  sorted.forEach((student, index) => {
    const target = groups[index % groupCount];
    target.memberIds.push(student.id);
  });

  groups.forEach((g) => {
    const members = students.filter((s) => g.memberIds.includes(s.id));
    const leader = [...members].sort(
      (a, b) => b.skills.leadership - a.skills.leadership
    )[0];
    g.leaderId = leader?.id ?? null;
  });

  return groups;
}
