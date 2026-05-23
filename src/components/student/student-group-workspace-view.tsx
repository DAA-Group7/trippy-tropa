"use client";

import Link from "next/link";
import { ArrowLeft, Crown, MessageSquare, Users } from "lucide-react";
import type { StudentGroupWorkspaceData } from "@/app/actions/groups";
import { routes } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

const cardShadow =
  "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]";

interface StudentGroupWorkspaceViewProps {
  data: StudentGroupWorkspaceData;
}

function formatStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StudentGroupWorkspaceView({
  data,
}: StudentGroupWorkspaceViewProps) {
  const { group, taskStats } = data;

  return (
    <div className="mx-auto w-full max-w-[1280px] flex-1 space-y-6 p-4 md:p-8">
      <Link
        href={routes.student.dashboard}
        className="inline-flex items-center gap-1 text-sm font-medium text-[#434655] hover:text-[#004ac6]"
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>

      <div>
        <p className="text-sm font-medium text-[#505f76]">{data.classroomName}</p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-[#191b23] sm:text-4xl">
          Group workspace
        </h1>
      </div>

      {!group ? (
        <div
          className={cn(
            "rounded-xl border border-dashed border-[#c3c6d7] bg-white p-12 text-center",
            cardShadow
          )}
        >
          <Users className="mx-auto mb-4 size-12 text-[#c3c6d7]" />
          <p className="text-lg font-medium text-[#191b23]">
            You are not assigned to a group yet
          </p>
          <p className="mt-2 text-sm text-[#505f76]">
            Your instructor will publish groups after reviewing skill assessments.
            Check back soon.
          </p>
        </div>
      ) : (
        <>
          <div
            className={cn(
              "rounded-xl border border-[#c3c6d7] bg-white p-4 sm:p-6",
              cardShadow
            )}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#191b23]">
                  {group.name}
                </h2>
                <p className="mt-1 text-sm text-[#434655]">
                  {group.members.length} members · {formatStatus(group.progressStatus)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={routes.student.tasks(data.classroomId)}
                  className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#004ac6]"
                >
                  Task board
                </Link>
                <Link
                  href={routes.student.assignments(data.classroomId)}
                  className="rounded-lg border border-[#c3c6d7] px-4 py-2 text-sm font-medium text-[#004ac6] hover:bg-[#f3f3fe]"
                >
                  Assignments
                </Link>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs font-semibold text-[#434655]">
                <span>Group progress</span>
                <span>{group.progressLabel}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#e7e7f3]">
                <div
                  className="h-full rounded-full bg-[#004ac6] transition-all"
                  style={{ width: `${group.progressPercent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[#505f76]">
                {taskStats.done} of {taskStats.total} tasks completed
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div
              className={cn(
                "rounded-xl border border-[#c3c6d7] bg-white p-6 lg:col-span-1",
                cardShadow
              )}
            >
              <h3 className="mb-1 text-lg font-semibold text-[#191b23]">Members</h3>
              <p className="mb-4 text-sm text-[#434655]">
                Group leader is highlighted
              </p>
              <ul className="space-y-2">
                {group.members.map((member) => (
                  <li
                    key={member.id}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2.5",
                      member.isLeader
                        ? "border border-[#004ac6]/20 bg-[#dbe1ff]/50"
                        : "bg-[#f3f3fe]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-full bg-[#d0e1fb] text-xs font-semibold text-[#54647a]">
                        {member.initials}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-[#191b23]">
                          {member.name}
                          {member.isLeader && (
                            <span className="ml-1 text-xs text-[#004ac6]">
                              (Leader)
                            </span>
                          )}
                        </p>
                        {member.averageSkill !== null && (
                          <p className="text-xs text-[#505f76]">
                            Skills {member.averageSkill} / 5
                          </p>
                        )}
                      </div>
                    </div>
                    {member.isLeader && (
                      <Crown className="size-4 shrink-0 text-[#004ac6]" />
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div
              className={cn(
                "rounded-xl border border-[#c3c6d7] bg-white p-6 lg:col-span-2",
                cardShadow
              )}
            >
              <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold text-[#191b23]">
                <MessageSquare className="size-5 text-[#004ac6]" />
                Discussion
              </h3>
              <p className="mb-4 text-sm text-[#434655]">
                Real-time group chat will be available in a future update.
              </p>
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-[#c3c6d7] bg-[#faf8ff] text-sm text-[#505f76]">
                Group chat messages appear here
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
