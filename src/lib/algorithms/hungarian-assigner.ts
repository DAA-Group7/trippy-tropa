import type {
  EstimateHoursLookup,
  StudentCapacity,
  TaskAssignment,
  TaskToAssign,
} from "@/lib/algorithms/assignment-types";
import { hungarianMinAssign } from "@/lib/algorithms/hungarian";
import { skillMatch } from "@/lib/algorithms/skill-match";

const INFEASIBLE_COST = 10_000_000;
const DUMMY_COST = 0;

function buildRoundCostMatrix(
  tasks: TaskToAssign[],
  students: StudentCapacity[],
  getEstimateHours: EstimateHoursLookup,
  remaining: Map<string, number>
): number[][] {
  const size = Math.max(tasks.length, students.length, 1);

  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => {
      const isDummyRow = row >= tasks.length;
      const isDummyCol = col >= students.length;

      if (isDummyRow && isDummyCol) return DUMMY_COST;
      if (isDummyRow || isDummyCol) return DUMMY_COST;

      const task = tasks[row]!;
      const student = students[col]!;
      const taskHours = getEstimateHours(student.id, task.id);
      const hoursLeft = remaining.get(student.id) ?? 0;

      if (taskHours == null || taskHours <= 0 || hoursLeft < taskHours) {
        return INFEASIBLE_COST;
      }

      const match = skillMatch(student.skills, task.requiredSkills);
      return Math.round((1 - match) * 10_000);
    })
  );
}

function isRealAssignment(
  row: number,
  col: number,
  taskCount: number,
  studentCount: number,
  cost: number[][]
): boolean {
  if (row >= taskCount || col >= studentCount) return false;
  return cost[row]![col]! < INFEASIBLE_COST / 2;
}

/**
 * Assigns tasks using repeated Hungarian rounds: each round finds the
 * lowest-cost one-to-one pairing among remaining tasks and students, then
 * subtracts estimated hours before the next round.
 */
export function assignTasksHungarian(
  tasks: TaskToAssign[],
  students: StudentCapacity[],
  getEstimateHours: EstimateHoursLookup,
  initialRemaining?: Map<string, number>
): TaskAssignment[] {
  const remaining = new Map(
    students.map((s) => [
      s.id,
      initialRemaining?.get(s.id) ?? s.availableHours,
    ])
  );

  const pending = [...tasks];
  const assignments: TaskAssignment[] = [];

  while (pending.length > 0) {
    const cost = buildRoundCostMatrix(
      pending,
      students,
      getEstimateHours,
      remaining
    );
    const rowToCol = hungarianMinAssign(cost);

    const roundAssignments: { taskIndex: number; assignment: TaskAssignment }[] =
      [];

    for (let row = 0; row < pending.length; row++) {
      const col = rowToCol[row] ?? -1;
      if (col < 0) continue;
      if (
        !isRealAssignment(row, col, pending.length, students.length, cost)
      ) {
        continue;
      }

      const task = pending[row]!;
      const student = students[col]!;
      const taskHours = getEstimateHours(student.id, task.id)!;
      const match = skillMatch(student.skills, task.requiredSkills);
      const matchPct = Math.round(match * 100);

      roundAssignments.push({
        taskIndex: row,
        assignment: {
          taskId: task.id,
          studentId: student.id,
          matchScore: matchPct,
          reason: `Hungarian match ${matchPct}% · ${taskHours}h (member estimate)`,
        },
      });
    }

    if (roundAssignments.length === 0) break;

    for (const { taskIndex, assignment } of roundAssignments.sort(
      (a, b) => b.taskIndex - a.taskIndex
    )) {
      assignments.push(assignment);
      const hours = getEstimateHours(assignment.studentId, assignment.taskId)!;
      remaining.set(
        assignment.studentId,
        (remaining.get(assignment.studentId) ?? 0) - hours
      );
      pending.splice(taskIndex, 1);
    }
  }

  return assignments;
}
