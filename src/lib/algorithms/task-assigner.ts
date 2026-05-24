import type { SkillRatings } from "@/types/database";

export interface TaskToAssign {
  id: string;
  title: string;
  requiredSkills: Partial<SkillRatings>;
}

export interface StudentCapacity {
  id: string;
  name: string;
  skills: SkillRatings;
  availableHours: number;
}

export interface TaskAssignment {
  taskId: string;
  studentId: string;
  matchScore: number;
  reason: string;
}

export type EstimateHoursLookup = (
  studentId: string,
  taskId: string
) => number | null;

function skillMatch(
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

/**
 * Greedy assignment by highest skill match within available hours.
 * Hours per (student, task) come from the group time estimate matrix.
 */
export function assignTasksOptimally(
  tasks: TaskToAssign[],
  students: StudentCapacity[],
  getEstimateHours: EstimateHoursLookup
): TaskAssignment[] {
  const remaining = new Map(students.map((s) => [s.id, s.availableHours]));
  const assignments: TaskAssignment[] = [];

  for (const task of tasks) {
    let best: TaskAssignment | null = null;

    for (const student of students) {
      const taskHours = getEstimateHours(student.id, task.id);
      if (taskHours == null || taskHours <= 0) continue;

      const hoursLeft = remaining.get(student.id) ?? 0;
      if (hoursLeft < taskHours) continue;

      const score = skillMatch(student.skills, task.requiredSkills);
      if (!best || score > best.matchScore) {
        best = {
          taskId: task.id,
          studentId: student.id,
          matchScore: Math.round(score * 100),
          reason: `Skill fit ${Math.round(score * 100)}% · ${taskHours}h (member estimate)`,
        };
      }
    }

    if (best) {
      const hours = getEstimateHours(best.studentId, best.taskId)!;
      assignments.push(best);
      remaining.set(
        best.studentId,
        (remaining.get(best.studentId) ?? 0) - hours
      );
    }
  }

  return assignments;
}
