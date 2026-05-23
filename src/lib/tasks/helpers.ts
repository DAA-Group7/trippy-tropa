import type { SkillKey, SkillRatings, TaskStatus } from "@/types/database";

export const SKILL_KEYS: SkillKey[] = [
  "communication",
  "leadership",
  "technical",
  "teamwork",
];

export const SKILL_LABELS: Record<SkillKey, string> = {
  communication: "Communication",
  leadership: "Leadership",
  technical: "Technical",
  teamwork: "Teamwork",
};

export function parseRequiredSkills(
  raw: unknown
): Partial<SkillRatings> {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  const result: Partial<SkillRatings> = {};
  for (const key of SKILL_KEYS) {
    const val = obj[key];
    if (typeof val === "number" && val >= 1 && val <= 5) {
      result[key] = val;
    }
  }
  return result;
}

export function formatRequiredSkills(skills: Partial<SkillRatings>): string {
  const entries = SKILL_KEYS.filter((k) => skills[k] != null).map(
    (k) => `${SKILL_LABELS[k]} (${skills[k]})`
  );
  return entries.length > 0 ? entries.join(", ") : "Any skills";
}

export function formatDeadline(iso: string | null): string {
  if (!iso) return "No deadline";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "No deadline";
  }
}

export function statusLabel(status: TaskStatus): string {
  switch (status) {
    case "todo":
      return "To Do";
    case "in_progress":
      return "In Progress";
    case "review":
      return "Review";
    case "done":
      return "Done";
  }
}

export const DEFAULT_STUDENT_CAPACITY_HOURS = 40;
