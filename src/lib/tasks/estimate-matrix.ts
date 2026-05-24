export type EstimateMap = Map<string, Map<string, number>>;

export function buildEstimateMap(
  rows: { task_id: string; user_id: string; estimated_hours: number }[]
): EstimateMap {
  const map: EstimateMap = new Map();
  for (const row of rows) {
    const hours = Number(row.estimated_hours);
    if (!Number.isFinite(hours) || hours <= 0) continue;
    if (!map.has(row.user_id)) map.set(row.user_id, new Map());
    map.get(row.user_id)!.set(row.task_id, hours);
  }
  return map;
}

export function getEstimateHours(
  map: EstimateMap,
  userId: string,
  taskId: string
): number | null {
  const hours = map.get(userId)?.get(taskId);
  return hours != null && hours > 0 ? hours : null;
}

export function countMatrixCells(
  memberIds: string[],
  taskIds: string[],
  map: EstimateMap
): { filled: number; total: number } {
  const total = memberIds.length * taskIds.length;
  if (total === 0) return { filled: 0, total: 0 };

  let filled = 0;
  for (const userId of memberIds) {
    for (const taskId of taskIds) {
      if (getEstimateHours(map, userId, taskId) != null) filled += 1;
    }
  }
  return { filled, total };
}

export function isMatrixComplete(
  memberIds: string[],
  taskIds: string[],
  map: EstimateMap
): boolean {
  const { filled, total } = countMatrixCells(memberIds, taskIds, map);
  return total > 0 && filled === total;
}
