"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink, Link2, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { ManagedGroup } from "@/app/actions/groups";
import { OfficerTopBar } from "@/components/layout/officer-top-bar";
import {
  formatProgressStatus,
  matchesGroupFilter,
  progressBarClass,
  statusBadgeClass,
} from "@/lib/groups/helpers";
import { routes } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

const cardShadow =
  "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]";

type GroupFilter = "all" | "in_progress" | "done";

const FILTER_OPTIONS: { id: GroupFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in_progress", label: "In Progress" },
  { id: "done", label: "Done" },
];

interface GroupManagementViewProps {
  classroomId: string;
  classroomName: string;
  inviteUrl: string;
  groups: ManagedGroup[];
}

function MemberAvatars({ group }: { group: ManagedGroup }) {
  const visible = group.members.slice(0, 4);
  const extra = group.members.length - visible.length;

  return (
    <div className="flex -space-x-2">
      {visible.map((member) => (
        <div
          key={member.id}
          className="flex size-8 items-center justify-center rounded-full border-2 border-white bg-[#d0e1fb] text-[10px] font-semibold text-[#54647a]"
          title={member.name}
        >
          {member.initials}
        </div>
      ))}
      {extra > 0 && (
        <div className="flex size-8 items-center justify-center rounded-full border-2 border-white bg-[#e1e2ed] text-xs font-semibold text-[#434655]">
          +{extra}
        </div>
      )}
    </div>
  );
}

function GroupCard({
  group,
  classroomId,
}: {
  group: ManagedGroup;
  classroomId: string;
}) {
  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-[#c3c6d7] bg-white p-6 transition-shadow",
        cardShadow,
        "hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.08)]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span
            className={cn(
              "mb-2 inline-block rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
              statusBadgeClass(group.progressStatus)
            )}
          >
            {formatProgressStatus(group.progressStatus)}
          </span>
          <h3 className="text-lg font-semibold text-[#191b23]">{group.name}</h3>
        </div>
        <Link
          href={routes.officer.generateGroups(classroomId)}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#c3c6d7] px-3 py-1.5 text-sm font-medium text-[#004ac6] transition-colors hover:bg-[#f3f3fe]"
        >
          <Pencil className="size-[18px]" />
          Edit
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#434655]">Leader</span>
          <span className="flex items-center gap-1.5 text-sm font-medium text-[#191b23]">
            <span className="flex size-6 items-center justify-center rounded-full bg-[#d0e1fb] text-[10px] font-semibold text-[#54647a]">
              {group.leaderInitials}
            </span>
            {group.leaderName}
          </span>
        </div>
        <div className="flex items-start justify-between">
          <span className="pt-1 text-sm text-[#434655]">Members</span>
          <MemberAvatars group={group} />
        </div>
      </div>

      <div className="mt-auto border-t border-[#c3c6d7]/50 pt-4">
        <div className="mb-1 flex justify-between text-xs font-semibold">
          <span className="text-[#434655]">Task completion</span>
          <span className="font-medium text-[#191b23]">
            {group.progressLabel}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#e7e7f3]">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              progressBarClass(group.progressStatus)
            )}
            style={{ width: `${group.progressPercent}%` }}
          />
        </div>
      </div>
    </article>
  );
}

export function GroupManagementView({
  classroomId,
  classroomName,
  inviteUrl,
  groups,
}: GroupManagementViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<GroupFilter>("all");

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return groups.filter((group) => {
      if (!matchesGroupFilter(group.progressStatus, activeFilter)) return false;
      if (!q) return true;
      return (
        group.name.toLowerCase().includes(q) ||
        group.leaderName.toLowerCase().includes(q)
      );
    });
  }, [groups, searchQuery, activeFilter]);

  const copyInvite = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    toast.success("Student join link copied");
  };

  return (
    <>
      <OfficerTopBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search groups..."
      />

      <div className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 md:px-6 md:py-8 lg:px-10">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#191b23] sm:text-4xl">
              Group Management
            </h1>
            <p className="mt-1 text-lg text-[#434655]">
              Oversee and manage active research groups in{" "}
              <span className="font-medium text-[#191b23]">{classroomName}</span>
              .
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-medium text-[#434655]">
              Filter by:
            </span>
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setActiveFilter(option.id)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition-colors",
                  activeFilter === option.id
                    ? "border-transparent bg-[#d0e1fb] text-[#54647a]"
                    : "border-[#c3c6d7] bg-white text-[#191b23] hover:bg-[#f3f3fe]"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div
          className={cn(
            "mb-8 flex flex-col gap-3 rounded-xl border border-[#c3c6d7] bg-white p-4 sm:flex-row sm:items-center sm:justify-between",
            cardShadow
          )}
        >
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#dbe1ff]">
              <Link2 className="size-5 text-[#004ac6]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#191b23]">
                Student join link
              </p>
              <p className="truncate text-sm text-[#505f76]">{inviteUrl}</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copyInvite()}
              className="inline-flex items-center gap-2 rounded-lg border border-[#c3c6d7] bg-[#f3f3fe] px-4 py-2 text-sm font-medium text-[#004ac6] hover:bg-[#e7e7f3]"
            >
              <Copy className="size-4" />
              Copy link
            </button>
            <Link
              href={routes.officer.generateGroups(classroomId)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#004ac6]"
            >
              Generate groups
            </Link>
            <a
              href={inviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-[#c3c6d7] px-4 py-2 text-sm font-medium text-[#505f76] hover:bg-[#f3f3fe]"
            >
              <ExternalLink className="size-4" />
              Preview join
            </a>
          </div>
        </div>

        {groups.length === 0 ? (
          <div
            className={cn(
              "rounded-xl border border-dashed border-[#c3c6d7] bg-white py-16 text-center",
              cardShadow
            )}
          >
            <p className="text-lg font-medium text-[#191b23]">No groups yet</p>
            <p className="mt-2 text-sm text-[#505f76]">
              Generate balanced groups from enrolled students with completed
              skill assessments.
            </p>
            <Link
              href={routes.officer.generateGroups(classroomId)}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#004ac6]"
            >
              Generate groups
            </Link>
          </div>
        ) : filteredGroups.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                classroomId={classroomId}
              />
            ))}
          </div>
        ) : (
          <div
            className={cn(
              "rounded-xl border border-dashed border-[#c3c6d7] bg-white py-16 text-center",
              cardShadow
            )}
          >
            <p className="text-lg font-medium text-[#191b23]">
              No groups match this filter
            </p>
            <p className="mt-2 text-sm text-[#505f76]">
              Try another filter or{" "}
              <Link
                href={routes.officer.generateGroups(classroomId)}
                className="font-medium text-[#004ac6] hover:underline"
              >
                regenerate groups
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </>
  );
}
