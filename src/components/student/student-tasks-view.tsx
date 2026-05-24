"use client";

import Link from "next/link";
import { ArrowRight, ClipboardList, Clock } from "lucide-react";
import type { StudentTasksHubData } from "@/app/actions/student-dashboard";
import { studentGroupWorkspacePath } from "@/lib/constants/group-workspace";
import { routes } from "@/lib/constants/routes";
import { stitch } from "@/lib/design/stitch";
import type { TaskStatus } from "@/types/database";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  review: "In review",
  done: "Done",
};

interface StudentTasksViewProps {
  data: StudentTasksHubData;
}

export function StudentTasksView({ data }: StudentTasksViewProps) {
  const { tasks, classrooms } = data;
  const classroomsWithGroups = classrooms.filter((c) => c.hasGroup);

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center border-b border-[#c3c6d7] bg-white px-4 md:px-6">
        <h1 className="font-heading text-xl font-bold text-[#191b23] md:text-2xl">
          My tasks
        </h1>
      </header>

      <div className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6 lg:p-8">
        {classrooms.length === 0 ? (
          <div
            className={cn(
              "rounded-xl border border-dashed border-stitch-border bg-stitch-surface p-10 text-center",
              stitch.cardShadow
            )}
          >
            <ClipboardList className="mx-auto mb-3 size-10 text-[#c3c6d7]" />
            <p className="text-sm font-medium text-[#191b23]">
              No classrooms yet
            </p>
            <p className="mt-2 text-sm text-[#505f76]">
              Join a class from your dashboard to see assignments here.
            </p>
            <Link
              href={routes.student.dashboard}
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#004ac6] hover:underline"
            >
              Go to dashboard
              <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : (
          <>
            {classroomsWithGroups.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[#505f76]">
                  Task boards
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {classroomsWithGroups.map((classroom) => (
                    <Link
                      key={classroom.id}
                      href={studentGroupWorkspacePath(classroom.id, "board")}
                      className={cn(
                        "flex items-center justify-between rounded-xl border border-stitch-border bg-stitch-surface p-4 transition-shadow hover:shadow-md",
                        stitch.cardShadow
                      )}
                    >
                      <div>
                        <p className="font-semibold text-[#191b23]">
                          {classroom.name}
                        </p>
                        <p className="text-sm text-[#505f76]">
                          {classroom.openTaskCount === 0
                            ? "Open group board"
                            : `${classroom.openTaskCount} open assignment${classroom.openTaskCount === 1 ? "" : "s"}`}
                        </p>
                      </div>
                      <ArrowRight className="size-5 text-[#737686]" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-[#191b23]">
                Your assignments
              </h2>
              {tasks.length === 0 ? (
                <p
                  className={cn(
                    "rounded-xl border border-dashed border-stitch-border bg-stitch-surface p-8 text-center text-sm text-stitch-text-muted",
                    stitch.cardShadow
                  )}
                >
                  {classroomsWithGroups.length === 0
                    ? "You are enrolled, but not placed in a group yet. Your instructor will assign groups soon."
                    : "No open assignments assigned to you right now."}
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {tasks.map((task) => (
                    <li key={task.id}>
                      <Link
                        href={studentGroupWorkspacePath(
                          task.classroomId,
                          "board"
                        )}
                        className={cn(
                          "flex flex-col gap-3 rounded-xl border border-stitch-border bg-stitch-surface p-4 transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between",
                          stitch.cardShadow
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <span className="rounded-full bg-stitch-accent-muted px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-stitch-text-secondary">
                            {task.classroomLabel}
                          </span>
                          <h3 className="mt-2 text-base font-semibold text-stitch-text">
                            {task.title}
                          </h3>
                          <span className="mt-1 inline-block text-xs font-medium text-[#505f76]">
                            {STATUS_LABELS[task.status]}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <Clock
                              className={cn(
                                "size-4",
                                task.urgent
                                  ? "text-stitch-destructive"
                                  : "text-stitch-text-secondary"
                              )}
                              aria-hidden
                            />
                            <span
                              className={cn(
                                "text-xs font-semibold",
                                task.urgent
                                  ? "text-stitch-destructive"
                                  : "text-stitch-text-secondary"
                              )}
                            >
                              Due {task.dueLabel}
                            </span>
                          </div>
                          <ArrowRight className="hidden size-5 text-[#737686] sm:block" />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
