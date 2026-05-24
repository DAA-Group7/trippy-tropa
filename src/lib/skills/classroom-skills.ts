import { SKILL_DEFINITIONS } from "@/lib/constants/skills";
import type { SkillKey, SkillRatings } from "@/types/database";

export type ClassroomSkillTemplateRow = {
  id: string;
  classroomId: string;
  metricKey: string;
  label: string;
  description: string | null;
  tooltip: string | null;
  multiplier: number;
  sortOrder: number;
};

export type ClassroomSkillTemplateInput = {
  metricKey: string;
  label: string;
  description?: string;
  tooltip?: string;
  multiplier: number;
  sortOrder: number;
};

const CORE_KEYS = new Set<string>([
  "communication",
  "leadership",
  "technical",
  "teamwork",
]);

export function isCoreSkillKey(key: string): key is SkillKey {
  return CORE_KEYS.has(key);
}

export function defaultTemplateInputs(): ClassroomSkillTemplateInput[] {
  return SKILL_DEFINITIONS.map((skill, index) => ({
    metricKey: skill.key,
    label: skill.label,
    description: skill.description,
    tooltip: skill.tooltip,
    multiplier: 1,
    sortOrder: index,
  }));
}

export function mapDbTemplate(row: {
  id: string;
  classroom_id: string;
  metric_key: string;
  label: string;
  description: string | null;
  tooltip: string | null;
  multiplier: number | string;
  sort_order: number;
}): ClassroomSkillTemplateRow {
  return {
    id: row.id,
    classroomId: row.classroom_id,
    metricKey: row.metric_key,
    label: row.label,
    description: row.description,
    tooltip: row.tooltip,
    multiplier: Number(row.multiplier),
    sortOrder: row.sort_order,
  };
}

/** Weighted rating used in group balance (rating × multiplier). */
export function weightedRating(rating: number, multiplier: number): number {
  return rating * multiplier;
}

export function weightedTotalFromRatings(
  templates: ClassroomSkillTemplateRow[],
  ratingsByMetricKey: Record<string, number>
): number {
  return templates.reduce((sum, template) => {
    const rating = ratingsByMetricKey[template.metricKey] ?? 3;
    return sum + weightedRating(rating, template.multiplier);
  }, 0);
}

/**
 * Map classroom template ratings into core SkillRatings for task matching.
 * Core keys use weighted values capped at 5; missing keys default to 3.
 */
export function toCoreSkillRatings(
  templates: ClassroomSkillTemplateRow[],
  ratingsByMetricKey: Record<string, number>
): SkillRatings {
  const base: SkillRatings = {
    communication: 3,
    leadership: 3,
    technical: 3,
    teamwork: 3,
  };

  for (const template of templates) {
    if (!isCoreSkillKey(template.metricKey)) continue;
    const rating = ratingsByMetricKey[template.metricKey] ?? 3;
    const weighted = Math.min(5, Math.round(weightedRating(rating, template.multiplier) * 10) / 10);
    base[template.metricKey] = weighted;
  }

  return base;
}

/** Map weighted total to a 0–5 display average for roster / group UI. */
export function normalizedWeightedAverage(
  templates: ClassroomSkillTemplateRow[],
  weightedTotal: number
): number {
  if (templates.length === 0) return 0;
  const weightSum = templates.reduce((sum, t) => sum + t.multiplier, 0);
  if (weightSum <= 0) return 0;
  return Math.round((weightedTotal / weightSum) * 10) / 10;
}

export function normalizeMetricKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}
