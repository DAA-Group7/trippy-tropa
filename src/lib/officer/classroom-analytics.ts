import type {
  ClassroomRosterStudent,
  ClassroomSkillMetric,
} from "@/app/actions/classrooms";

export const SKILL_CHART_COLORS = [
  "#004ac6",
  "#b4c5ff",
  "#505f76",
  "#737686",
] as const;

export type SkillChartPoint = {
  skill: string;
  average: number;
  fill: string;
};

export type EnrollmentTrendPoint = {
  dateKey: string;
  label: string;
  enrolled: number;
  joinsThatDay: number;
};

export function buildSkillChartData(
  metrics: ClassroomSkillMetric[]
): SkillChartPoint[] {
  return metrics.map((metric, index) => ({
    skill: metric.label,
    average: metric.average,
    fill: SKILL_CHART_COLORS[index % SKILL_CHART_COLORS.length],
  }));
}

/** Cumulative enrollments by join date (for line chart). */
export function buildEnrollmentTrend(
  roster: ClassroomRosterStudent[]
): EnrollmentTrendPoint[] {
  if (roster.length === 0) return [];

  const sorted = [...roster].sort(
    (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
  );

  const joinsByDay = new Map<string, number>();
  for (const student of sorted) {
    const day = new Date(student.joinedAt).toISOString().slice(0, 10);
    joinsByDay.set(day, (joinsByDay.get(day) ?? 0) + 1);
  }

  const days = [...joinsByDay.keys()].sort();
  let cumulative = 0;

  return days.map((dateKey) => {
    const joinsThatDay = joinsByDay.get(dateKey) ?? 0;
    cumulative += joinsThatDay;
    return {
      dateKey,
      label: new Date(`${dateKey}T12:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      enrolled: cumulative,
      joinsThatDay,
    };
  });
}
