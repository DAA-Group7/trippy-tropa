"use client";

import { useEffect, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { toast } from "sonner";
import { updateTaskStatus } from "@/app/actions/tasks";
import type { KanbanTaskData } from "@/app/actions/tasks";
import type { TaskStatus } from "@/types/database";
import { cn } from "@/lib/utils";

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "review", title: "Review" },
  { id: "done", title: "Done" },
];

const cardShadow =
  "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]";

function KanbanCardContent({
  task,
  dragHandleProps,
  isDragging,
  setNodeRef,
}: {
  task: KanbanTaskData;
  dragHandleProps?: Record<string, unknown>;
  isDragging?: boolean;
  setNodeRef?: (node: HTMLElement | null) => void;
}) {
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl border border-[#c3c6d7] bg-white p-3",
        cardShadow,
        isDragging && "opacity-50",
        !task.canDrag && "opacity-90"
      )}
    >
      <div className="flex items-start gap-2">
        {task.canDrag ? (
          <button
            type="button"
            className="mt-0.5 cursor-grab touch-none text-[#737686] active:cursor-grabbing"
            {...dragHandleProps}
          >
            <GripVertical className="size-4" />
          </button>
        ) : (
          <span className="mt-0.5 size-4" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug text-[#191b23]">
            {task.title}
          </p>
          <p className="mt-1 text-xs text-[#434655]">
            Assigned: {task.assignee}
          </p>
          <p className="text-xs text-[#505f76]">Due: {task.deadline}</p>
          <span className="mt-2 inline-block rounded-full bg-[#e7e7f3] px-2 py-0.5 text-xs font-medium text-[#434655]">
            {task.myEstimateHours != null
              ? `${task.myEstimateHours}h your est.`
              : "Add time estimate"}
          </span>
          {!task.canDrag && (
            <p className="mt-1 text-[10px] text-[#737686]">View only</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DraggableKanbanCard({ task }: { task: KanbanTaskData }) {
  if (!task.canDrag) {
    return <KanbanCardContent task={task} />;
  }

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  });

  return (
    <KanbanCardContent
      task={task}
      dragHandleProps={{ ...attributes, ...listeners }}
      isDragging={isDragging}
      setNodeRef={setNodeRef}
    />
  );
}

function DroppableColumn({
  column,
  tasks,
}: {
  column: (typeof COLUMNS)[number];
  tasks: KanbanTaskData[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const colTasks = tasks.filter((t) => t.status === column.id);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[280px] flex-col rounded-xl border bg-[#f3f3fe]/80 p-3 transition-colors",
        isOver ? "border-[#004ac6] ring-2 ring-[#004ac6]/15" : "border-[#c3c6d7]"
      )}
    >
      <h3 className="mb-3 text-sm font-semibold text-[#191b23]">
        {column.title}
        <span className="ml-2 text-xs font-normal text-[#505f76]">
          ({colTasks.length})
        </span>
      </h3>
      <div className="flex flex-1 flex-col gap-2">
        {colTasks.map((task) => (
          <DraggableKanbanCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  initialTasks: KanbanTaskData[];
}

export function KanbanBoard({ initialTasks }: KanbanBoardProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (!task?.canDrag) return;
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const taskId = String(active.id);
    const task = tasks.find((t) => t.id === taskId);
    if (!task?.canDrag) return;

    const newStatus = COLUMNS.find((c) => c.id === over.id)?.id;
    if (!newStatus || newStatus === task.status) return;

    const previousStatus = task.status;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    startTransition(async () => {
      const result = await updateTaskStatus({ taskId, status: newStatus });
      if (!result.ok) {
        toast.error(result.error);
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, status: previousStatus } : t
          )
        );
      }
    });
  };

  const activeTask = tasks.find((t) => t.id === activeId);

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#c3c6d7] bg-white p-12 text-center">
        <p className="text-sm text-[#505f76]">
          No tasks in your group yet. Your officer will add tasks soon.
        </p>
      </div>
    );
  }

  return (
    <div className={cn(isPending && "pointer-events-none opacity-80")}>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => (
            <DroppableColumn key={col.id} column={col} tasks={tasks} />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? (
            <KanbanCardContent task={activeTask} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>
      <p className="mt-4 text-xs text-[#505f76]">
        Drag cards you are assigned to between columns. Other members&apos;
        tasks are view-only.
      </p>
    </div>
  );
}
