import type { SkillRatings } from "@/types/database";
import type { BalancedGroup, StudentWithSkills } from "@/lib/algorithms/group-balancer";
import { generateBalancedGroups } from "@/lib/algorithms/group-balancer";

export type GroupVarianceBadge = "high-variance" | "balanced" | "homogeneous";

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export function parseGroupSize(label: string): number {
  const match = label.match(/(\d+)/);
  return match ? Number.parseInt(match[1]!, 10) : 4;
}

export function computeGroupCount(
  studentCount: number,
  groupSize: number,
  maxGroups: number
): number {
  if (studentCount === 0) return 0;
  const needed = Math.ceil(studentCount / groupSize);
  return Math.min(Math.max(1, needed), maxGroups);
}

export function skillSum(skills: SkillRatings): number {
  return (
    skills.communication +
    skills.leadership +
    skills.technical +
    skills.teamwork
  );
}

export function averageSkill(skills: SkillRatings): number {
  return Math.round((skillSum(skills) / 4) * 10) / 10;
}

export function assignLeader(
  memberIds: string[],
  studentsById: Map<string, StudentWithSkills>,
  autoAssign: boolean
): string | null {
  if (!autoAssign || memberIds.length === 0) return null;

  const members = memberIds
    .map((id) => studentsById.get(id))
    .filter((s): s is StudentWithSkills => !!s);

  const leader = [...members].sort(
    (a, b) => b.skills.leadership - a.skills.leadership
  )[0];

  return leader?.id ?? null;
}

export function computeGroupBadge(
  memberIds: string[],
  studentsById: Map<string, StudentWithSkills>
): GroupVarianceBadge {
  if (memberIds.length <= 1) return "homogeneous";

  const sums = memberIds
    .map((id) => studentsById.get(id))
    .filter((s): s is StudentWithSkills => !!s)
    .map((s) => skillSum(s.skills));

  if (sums.length === 0) return "homogeneous";

  const spread = Math.max(...sums) - Math.min(...sums);
  if (spread > 8) return "high-variance";
  if (spread < 4) return "homogeneous";
  return "balanced";
}

export function computeVarianceBadge(
  groups: { memberIds: string[] }[],
  studentsById: Map<string, StudentWithSkills>
): GroupVarianceBadge {
  if (groups.length < 2) return "homogeneous";

  const totals = groups.map((g) => {
    if (g.memberIds.length === 0) return 0;
    const sum = g.memberIds.reduce(
      (acc, id) => acc + skillSum(studentsById.get(id)!.skills),
      0
    );
    return sum / g.memberIds.length;
  });

  const mean = totals.reduce((a, b) => a + b, 0) / totals.length;
  const variance =
    totals.reduce((acc, t) => acc + (t - mean) ** 2, 0) / totals.length;

  if (variance > 2.5) return "high-variance";
  if (variance < 0.8) return "homogeneous";
  return "balanced";
}

export function getVarianceBadgeClass(variant: GroupVarianceBadge): string {
  switch (variant) {
    case "high-variance":
      return "bg-[#ffdbcd] text-[#360f00]";
    case "balanced":
      return "bg-[#d0e1fb] text-[#54647a]";
    default:
      return "bg-[#e7e7f3] text-[#434655]";
  }
}

export function varianceLabel(variant: GroupVarianceBadge): string {
  switch (variant) {
    case "high-variance":
      return "High Variance";
    case "balanced":
      return "Balanced";
    default:
      return "Homogeneous";
  }
}

export function toEditableGroups(
  balanced: BalancedGroup[],
  studentsById: Map<string, StudentWithSkills>,
  autoAssignLeader: boolean
): EditableGroup[] {
  return balanced.map((g) => ({
    id: g.id,
    name: g.name,
    memberIds: [...g.memberIds],
    leaderId: autoAssignLeader
      ? assignLeader(g.memberIds, studentsById, true)
      : g.leaderId,
  }));
}

export type EditableGroup = {
  id: string;
  name: string;
  memberIds: string[];
  leaderId: string | null;
};

export function regenerateGroups(
  students: StudentWithSkills[],
  groupCount: number,
  autoAssignLeader: boolean
): EditableGroup[] {
  const balanced = generateBalancedGroups(students, groupCount);
  const studentsById = new Map(students.map((s) => [s.id, s]));
  return toEditableGroups(balanced, studentsById, autoAssignLeader);
}

export function moveStudentToGroup(
  groups: EditableGroup[],
  studentId: string,
  targetGroupId: string,
  studentsById: Map<string, StudentWithSkills>,
  autoAssignLeader: boolean
): EditableGroup[] {
  const next = groups.map((g) => ({
    ...g,
    memberIds: g.memberIds.filter((id) => id !== studentId),
  }));

  const target = next.find((g) => g.id === targetGroupId);
  if (!target) return groups;

  target.memberIds.push(studentId);

  if (autoAssignLeader) {
    for (const group of next) {
      group.leaderId = assignLeader(group.memberIds, studentsById, true);
    }
  }

  return next;
}

export function formatProgressStatus(status: string): string {
  switch (status) {
    case "not_started":
      return "Not Started";
    case "in_progress":
      return "In Progress";
    case "reviewing":
      return "Reviewing";
    case "done":
      return "Done";
    default:
      return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export function statusBadgeClass(status: string): string {
  switch (status) {
    case "done":
      return "bg-[#d0e1fb] text-[#54647a]";
    case "in_progress":
    case "reviewing":
      return "bg-[#dbe1ff] text-[#004ac6]";
    default:
      return "bg-[#e7e7f3] text-[#434655]";
  }
}

export function progressBarClass(status: string): string {
  switch (status) {
    case "done":
      return "bg-[#004ac6]";
    case "in_progress":
    case "reviewing":
      return "bg-[#2563eb]";
    default:
      return "bg-[#737686]";
  }
}

export function matchesGroupFilter(
  status: string,
  filter: "all" | "in_progress" | "done"
): boolean {
  if (filter === "all") return true;
  if (filter === "done") return status === "done";
  return status !== "done";
}
