import type { SkillRatings } from "@/types/database";

export function skillMatch(
  student: SkillRatings,
  required: Partial<SkillRatings>
): number {
  const keys = Object.keys(required) as (keyof SkillRatings)[];
  if (keys.length === 0) return 1;
  const total = keys.reduce(
    (sum, k) => sum + student[k] * (required[k] ?? 0),
    0
  );
  const max = keys.reduce((sum, k) => sum + 5 * (required[k] ?? 0), 0);
  return max > 0 ? total / max : 0;
}

/** Skill fit as integer percent (0–100) for display and overrides. */
export function computeTaskMatchScore(
  studentSkills: SkillRatings,
  requiredSkills: Partial<SkillRatings>
): number {
  return Math.round(skillMatch(studentSkills, requiredSkills) * 100);
}
