"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ClipboardList, Users } from "lucide-react";
import type { StudentGroupWorkspaceData } from "@/app/actions/groups";
import type { GroupMessageItem } from "@/app/actions/messages";
import type { KanbanTaskData } from "@/app/actions/tasks";
import { GroupChatPanel } from "@/components/chat/group-chat-panel";
import { GroupWorkspaceBoardPanel } from "@/components/student/group-workspace-board-panel";
import { GroupWorkspaceFilesPanel } from "@/components/student/group-workspace-files-panel";
import { GroupWorkspaceMembersPanel } from "@/components/student/group-workspace-members-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  parseGroupWorkspaceTab,
  studentGroupWorkspacePath,
  type GroupWorkspaceTab,
} from "@/lib/constants/group-workspace";
import { stitch } from "@/lib/design/stitch";
import { routes } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

interface StudentGroupWorkspaceViewProps {
  data: StudentGroupWorkspaceData;
  initialMessages: GroupMessageItem[];
  kanbanTasks: KanbanTaskData[];
}

function formatStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StudentGroupWorkspaceView({
  data,
  initialMessages,
  kanbanTasks,
}: StudentGroupWorkspaceViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseGroupWorkspaceTab(searchParams.get("tab"));
  const { group, taskStats } = data;

  const setTab = (tab: GroupWorkspaceTab) => {
    const href = studentGroupWorkspacePath(data.classroomId, tab);
    router.replace(href, { scroll: false });
  };

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
              <Link
                href={routes.student.assignments(data.classroomId)}
                className={cn(stitch.btnSecondary, "inline-flex items-center gap-2")}
              >
                <ClipboardList className="size-4" aria-hidden />
                Assignment details
              </Link>
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

          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setTab(parseGroupWorkspaceTab(value as string))
            }
            className="gap-4"
          >
            <TabsList
              variant="line"
              className="h-auto w-full justify-start gap-0 rounded-none border-b border-stitch-border bg-transparent p-0"
            >
              <TabsTrigger
                value="board"
                className="rounded-none px-4 py-2.5 after:bottom-0 data-active:font-semibold"
              >
                Board
              </TabsTrigger>
              <TabsTrigger
                value="members"
                className="rounded-none px-4 py-2.5 after:bottom-0 data-active:font-semibold"
              >
                Members
              </TabsTrigger>
              <TabsTrigger
                value="chat"
                className="rounded-none px-4 py-2.5 after:bottom-0 data-active:font-semibold"
              >
                Chat
              </TabsTrigger>
              <TabsTrigger
                value="files"
                className="rounded-none px-4 py-2.5 after:bottom-0 data-active:font-semibold"
              >
                Files
              </TabsTrigger>
            </TabsList>

            <TabsContent value="board" className="mt-0 outline-none">
              <div className={cn(stitch.card, "p-4 sm:p-6", stitch.cardShadow)}>
                <GroupWorkspaceBoardPanel
                  groupId={group.id}
                  tasks={kanbanTasks}
                  groupName={group.name}
                />
              </div>
            </TabsContent>

            <TabsContent value="members" className="mt-0 outline-none">
              <div className={cn(stitch.card, "p-6", stitch.cardShadow)}>
                <GroupWorkspaceMembersPanel group={group} />
              </div>
            </TabsContent>

            <TabsContent value="chat" className="mt-0 outline-none">
              <div
                className={cn(
                  stitch.card,
                  "min-h-[min(520px,70vh)] p-4 sm:p-6",
                  stitch.cardShadow
                )}
              >
                <GroupChatPanel
                  groupId={group.id}
                  initialMessages={initialMessages}
                />
              </div>
            </TabsContent>

            <TabsContent value="files" className="mt-0 outline-none">
              <GroupWorkspaceFilesPanel />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
