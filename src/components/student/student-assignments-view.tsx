"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { StudentAssignmentsData } from "@/app/actions/tasks";
import { routes } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

const cardShadow =
  "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]";

interface StudentAssignmentsViewProps {
  data: StudentAssignmentsData;
}

export function StudentAssignmentsView({ data }: StudentAssignmentsViewProps) {
  return (
    <div className="mx-auto w-full max-w-[1280px] flex-1 space-y-6 p-4 md:p-8">
      <Link
        href={routes.student.group(data.classroomId)}
        className="inline-flex items-center gap-1 text-sm font-medium text-[#434655] hover:text-[#004ac6]"
      >
        <ArrowLeft className="size-4" />
        Back to group workspace
      </Link>

      <div>
        <p className="text-sm font-medium text-[#505f76]">{data.classroomName}</p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-[#191b23]">
          Optimized assignments
        </h1>
        <p className="mt-1 text-sm text-[#434655]">
          How tasks were allocated
          {data.groupName ? ` for ${data.groupName}` : ""} based on skills and
          available time.
        </p>
      </div>

      {data.assignments.length === 0 ? (
        <div
          className={cn(
            "rounded-xl border border-dashed border-[#c3c6d7] bg-white p-12 text-center",
            cardShadow
          )}
        >
          <p className="font-medium text-[#191b23]">No assignments yet</p>
          <p className="mt-2 text-sm text-[#505f76]">
            Your instructor will create tasks and run auto-assign. Check the
            task board afterward.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.assignments.map((a) => (
            <article
              key={a.taskId}
              className={cn(
                "rounded-xl border bg-white p-6",
                cardShadow,
                a.isCurrentUser
                  ? "border-[#004ac6]/30 ring-1 ring-[#004ac6]/10"
                  : "border-[#c3c6d7]"
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="text-lg font-semibold text-[#191b23]">
                  {a.taskTitle}
                </h2>
                <span className="rounded-full bg-[#dbe1ff] px-2.5 py-0.5 text-xs font-semibold text-[#004ac6]">
                  {a.estimatedHours > 0
                    ? `${a.estimatedHours}h member est.`
                    : "No estimate"}
                </span>
              </div>
              <p className="mt-1 text-sm text-[#434655]">
                Assigned to:{" "}
                <span className="font-medium text-[#191b23]">
                  {a.assigneeName}
                  {a.isCurrentUser && " (you)"}
                </span>
              </p>
              <p className="mt-2 text-xs text-[#505f76]">
                Required skills: {a.requiredSkillsLabel}
              </p>
              {a.matchScore != null && (
                <p className="mt-3 text-sm">
                  <span className="font-semibold text-[#004ac6]">
                    {a.matchScore}% skill match
                  </span>
                </p>
              )}
              {a.reason && (
                <p className="mt-2 text-sm text-[#434655]">
                  <span className="font-medium text-[#191b23]">Why: </span>
                  {a.reason}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
