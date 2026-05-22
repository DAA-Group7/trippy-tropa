"use client";

import {
  DndContext,
  DragOverlay,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types/database";

export interface KanbanTask {
  id: string;
  title: string;
  assignee: string;
  deadline: string;
  estimatedHours: number;
  status: TaskStatus;
}

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "review", title: "Review" },
  { id: "done", title: "Done" },
];

const DEMO_TASKS: KanbanTask[] = [
  {
    id: "1",
    title: "Research outline",
    assignee: "You",
    deadline: "May 28",
    estimatedHours: 3,
    status: "todo",
  },
  {
    id: "2",
    title: "Draft introduction",
    assignee: "Alex",
    deadline: "May 30",
    estimatedHours: 4,
    status: "in_progress",
  },
];

function TaskCard({ task }: { task: KanbanTask }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  return (
    <Card
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn("cursor-grab shadow-sm", isDragging && "opacity-50")}
    >
      <CardHeader className="flex flex-row items-start gap-2 space-y-0 p-3 pb-0">
        <button
          type="button"
          className="mt-0.5 text-muted-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <CardTitle className="text-sm font-medium leading-snug">
          {task.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-3 pt-2 text-xs text-muted-foreground">
        <p>Assigned: {task.assignee}</p>
        <p>Due: {task.deadline}</p>
        <Badge variant="secondary">{task.estimatedHours}h est.</Badge>
      </CardContent>
    </Card>
  );
}

export function KanbanBoard({ initialTasks = DEMO_TASKS }: { initialTasks?: KanbanTask[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const overId = String(over.id);
    const column = COLUMNS.find((c) => c.id === overId);
    if (!column) return;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === active.id ? { ...t, status: column.id } : t
      )
    );
  };

  const activeTask = tasks.find((t) => t.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              id={col.id}
              className="flex min-h-[280px] flex-col rounded-xl border border-border bg-muted/30 p-3"
            >
              <h3 className="mb-3 text-sm font-semibold">{col.title}</h3>
              <SortableContext
                items={colTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-1 flex-col gap-2">
                  {colTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
