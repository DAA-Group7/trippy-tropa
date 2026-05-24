import { getEstimateHours, type EstimateMap } from "@/lib/tasks/estimate-matrix";

export type AssignmentMatrixCell = {
  estimatedHours: number | null;
  isAssigned: boolean;
  matchScore: number | null;
};

export type GroupAssignmentMatrix = {
  groupId: string;
  groupName: string;
  members: { id: string; name: string; colorIndex: number }[];
  tasks: { id: string; title: string; assigneeId: string | null }[];
  cells: Record<string, Record<string, AssignmentMatrixCell>>;
};

type TaskRow = {
  id: string;
  group_id: string;
  title: string;
  assigned_to: string | null;
  assignment_match_score: number | null;
};

export function buildGroupAssignmentMatrices(
  groups: { id: string; name: string }[],
  membersByGroup: Map<string, { id: string; name: string }[]>,
  taskRows: TaskRow[],
  estimateMap: EstimateMap
): GroupAssignmentMatrix[] {
  const tasksByGroup = new Map<string, TaskRow[]>();
  for (const task of taskRows) {
    const list = tasksByGroup.get(task.group_id) ?? [];
    list.push(task);
    tasksByGroup.set(task.group_id, list);
  }

  return groups.map((group) => {
    const members = (membersByGroup.get(group.id) ?? []).map((m, index) => ({
      ...m,
      colorIndex: index,
    }));
    const groupTasks = tasksByGroup.get(group.id) ?? [];
    const cells: Record<string, Record<string, AssignmentMatrixCell>> = {};

    for (const member of members) {
      cells[member.id] = {};
      for (const task of groupTasks) {
        const estimatedHours = getEstimateHours(
          estimateMap,
          member.id,
          task.id
        );
        const isAssigned = task.assigned_to === member.id;
        cells[member.id][task.id] = {
          estimatedHours,
          isAssigned,
          matchScore: isAssigned ? task.assignment_match_score : null,
        };
      }
    }

    return {
      groupId: group.id,
      groupName: group.name,
      members,
      tasks: groupTasks.map((t) => ({
        id: t.id,
        title: t.title,
        assigneeId: t.assigned_to,
      })),
      cells,
    };
  });
}
