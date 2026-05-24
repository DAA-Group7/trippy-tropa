"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { KanbanTaskData } from "@/app/actions/tasks";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { useTasksRealtime } from "@/hooks/use-tasks-realtime";

interface GroupWorkspaceBoardPanelProps {
  groupId: string;
  tasks: KanbanTaskData[];
  groupName: string;
}

export function GroupWorkspaceBoardPanel({
  groupId,
  tasks,
  groupName,
}: GroupWorkspaceBoardPanelProps) {
  const router = useRouter();
  const onTasksChange = useCallback(() => {
    router.refresh();
  }, [router]);

  useTasksRealtime(groupId, onTasksChange);

  return (
    <div className="space-y-4">
      <p className="text-sm text-stitch-text-secondary">
        {groupName} — drag cards between columns to update status.
      </p>
      <KanbanBoard initialTasks={tasks} />
    </div>
  );
}
