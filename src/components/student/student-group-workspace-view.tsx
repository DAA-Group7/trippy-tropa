"use client";

import Link from "next/link";
import { ArrowLeft, Crown, Users } from "lucide-react";
import type { StudentGroupWorkspaceData } from "@/app/actions/groups";
import type { GroupMessageItem } from "@/app/actions/messages";
import { GroupChatPanel } from "@/components/chat/group-chat-panel";
import { stitch } from "@/lib/design/stitch";
import { routes } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

interface StudentGroupWorkspaceViewProps {
  data: StudentGroupWorkspaceData;
  initialMessages: GroupMessageItem[];
}

function formatStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StudentGroupWorkspaceView({
  data,
  initialMessages,
}: StudentGroupWorkspaceViewProps) {
  const { group, taskStats } = data;

  return (
    <div className="mx-auto w-full max-w-[1280px] flex-1 space-y-6 p-4 md:p-8">
      <Link
        href={routes.student.dashboard}
        className="inline-flex items-center gap-1 text-sm font-medium text-stitch-text-secondary hover:text-stitch-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to dashboard
      </Link>

      <div>
        <p className="text-sm font-medium text-stitch-text-muted">
          {data.classroomName}
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-stitch-text sm:text-4xl">
          Group workspace
        </h1>
      </div>

      {!group ? (
        <div
          className={cn(
            "rounded-xl border border-dashed border-stitch-border bg-stitch-surface p-12 text-center",
            stitch.cardShadow
          )}
        >
          <Users
            className="mx-auto mb-4 size-12 text-stitch-border"
            aria-hidden
          />
          <p className="text-lg font-medium text-stitch-text">
            You are not assigned to a group yet
          </p>
          <p className="mt-2 text-sm text-stitch-text-muted">
            Your instructor will publish groups after reviewing skill assessments.
            Check back soon.
          </p>
        </div>
      ) : (
        <>
          <div className={cn(stitch.card, "p-4 sm:p-6", stitch.cardShadow)}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-stitch-text">
                  {group.name}
                </h2>
                <p className="mt-1 text-sm text-stitch-text-secondary">
                  {group.members.length} members ·{" "}
                  {formatStatus(group.progressStatus)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={routes.student.tasks(data.classroomId)} className={stitch.btnPrimary}>
                  Task board
                </Link>
                <Link
                  href={routes.student.assignments(data.classroomId)}
                  className={stitch.btnSecondary}
                >
                  Assignments
                </Link>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs font-semibold text-stitch-text-secondary">
                <span>Group progress</span>
                <span>{group.progressLabel}</span>
              </div>
              <div
                className={cn(
                  "h-2 overflow-hidden rounded-full",
                  stitch.progressTrack
                )}
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    stitch.progressFill
                  )}
                  style={{ width: `${group.progressPercent}%` }}
                  role="progressbar"
                  aria-valuenow={group.progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Group task progress"
                />
              </div>
              <p className="mt-2 text-xs text-stitch-text-muted">
                {taskStats.done} of {taskStats.total} tasks completed
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div
              className={cn(stitch.card, "p-6 lg:col-span-1", stitch.cardShadow)}
            >
              <h3 className="mb-1 text-lg font-semibold text-stitch-text">
                Members
              </h3>
              <p className="mb-4 text-sm text-stitch-text-secondary">
                Group leader is highlighted
              </p>
              <ul className="space-y-2">
                {group.members.map((member) => (
                  <li
                    key={member.id}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2.5",
                      member.isLeader
                        ? "border border-stitch-primary/20 bg-stitch-accent-soft"
                        : "bg-stitch-accent-soft"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-full bg-stitch-accent-muted text-xs font-semibold text-stitch-nav-active">
                        {member.initials}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-stitch-text">
                          {member.name}
                          {member.isLeader && (
                            <span className="ml-1 text-xs text-stitch-primary">
                              (Leader)
                            </span>
                          )}
                        </p>
                        {member.averageSkill !== null && (
                          <p className="text-xs text-stitch-text-muted">
                            Skills {member.averageSkill} / 5
                          </p>
                        )}
                      </div>
                    </div>
                    {member.isLeader && (
                      <Crown
                        className="size-4 shrink-0 text-stitch-primary"
                        aria-label="Group leader"
                      />
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div
              className={cn(stitch.card, "p-6 lg:col-span-2", stitch.cardShadow)}
            >
              <GroupChatPanel
                groupId={group.id}
                initialMessages={initialMessages}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
