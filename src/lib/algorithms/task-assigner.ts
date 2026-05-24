import type {
  EstimateHoursLookup,
  StudentCapacity,
  TaskAssignment,
  TaskToAssign,
} from "@/lib/algorithms/assignment-types";
import { assignTasksHungarian } from "@/lib/algorithms/hungarian-assigner";
import {
  computeTaskMatchScore,
  skillMatch,
} from "@/lib/algorithms/skill-match";

export type {
  EstimateHoursLookup,
  StudentCapacity,
  TaskAssignment,
  TaskToAssign,
};

export { computeTaskMatchScore, skillMatch };

/**
 * Optimal task assignment via the Hungarian algorithm (repeated rounds per group).
 * Hours per (student, task) come from the group time estimate matrix.
 *
 * Instructor-facing guide: docs/algorithms/greedy-assignment.md
 * In-app: routes.officer.autoAssignHelp
 */
export function assignTasksOptimally(
  tasks: TaskToAssign[],
  students: StudentCapacity[],
  getEstimateHours: EstimateHoursLookup,
  initialRemaining?: Map<string, number>
): TaskAssignment[] {
  return assignTasksHungarian(
    tasks,
    students,
    getEstimateHours,
    initialRemaining
  );
}
