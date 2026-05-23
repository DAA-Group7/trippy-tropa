"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { KanbanTaskData } from "@/app/actions/tasks";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { routes } from "@/lib/constants/routes";

interface StudentKanbanViewProps {
  classroomId: string;
  classroomName: string;
  groupName: string;
  tasks: KanbanTaskData[];
}

export function StudentKanbanView({
  classroomId,
  classroomName,
  groupName,
  tasks,
}: StudentKanbanViewProps) {
  return (
    <div className="mx-auto w-full max-w-[1280px] flex-1 space-y-6 p-4 md:p-8">
      <Link
        href={routes.student.group(classroomId)}
        className="inline-flex items-center gap-1 text-sm font-medium text-[#434655] hover:text-[#004ac6]"
      >
        <ArrowLeft className="size-4" />
        Back to group workspace
      </Link>

      <div>
        <p className="text-sm font-medium text-[#505f76]">{classroomName}</p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-[#191b23]">
          Task board
        </h1>
        <p className="mt-1 text-sm text-[#434655]">
          {groupName} — drag your assigned cards between columns.
        </p>
      </div>

      <KanbanBoard initialTasks={tasks} />
    </div>
  );
}
