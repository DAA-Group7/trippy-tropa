"use client";

import { useState } from "react";
import {
  Copy,
  GripVertical,
  Link2,
  RefreshCw,
  Save,
  Star,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { OfficerPageHeader } from "@/components/layout/officer-page-header";
import {
  BALANCING_STRATEGIES,
  DEMO_GROUPS,
  GROUP_SIZES,
  getVarianceBadgeClass,
  type DemoGroup,
  type DemoStudent,
} from "@/lib/constants/group-generation-demo";
import { cn } from "@/lib/utils";

const cardShadow =
  "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]";

const selectClass =
  "w-full appearance-none rounded-lg border border-[#c3c6d7] bg-[#faf8ff] px-4 py-2.5 text-base text-[#191b23] focus:border-[#004ac6] focus:outline-none focus:ring-1 focus:ring-[#004ac6]";

interface GroupGenerationViewProps {
  classroomName: string;
  inviteUrl: string | null;
}

function StudentRow({ student }: { student: DemoStudent }) {
  return (
    <div className="flex cursor-move items-center justify-between rounded-lg border border-transparent p-2 transition-colors hover:border-[#c3c6d7] hover:bg-[#f3f3fe]">
      <div className="flex items-center gap-3">
        <GripVertical className="size-5 shrink-0 text-[#737686]" aria-hidden />
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            student.avatarClass
          )}
        >
          {student.initials}
        </div>
        <div>
          <p className="flex items-center gap-1 text-sm font-medium text-[#191b23]">
            {student.name}
            {student.isLeader && (
              <Star
                className="size-4 fill-[#943700] text-[#943700]"
                aria-label="Group leader"
              />
            )}
          </p>
          <p className="text-sm text-[#434655]">{student.meta}</p>
        </div>
      </div>
    </div>
  );
}

function GroupCard({ group }: { group: DemoGroup }) {
  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-[#c3c6d7] bg-white",
        cardShadow
      )}
    >
      <div className="flex cursor-move items-center justify-between border-b border-[#c3c6d7] bg-[#f3f3fe] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <GripVertical className="size-5 text-[#737686]" aria-hidden />
          <h3 className="text-lg font-semibold text-[#191b23]">{group.name}</h3>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
            getVarianceBadgeClass(group.badge.variant)
          )}
        >
          {group.badge.label}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        {group.students.map((student) => (
          <StudentRow key={student.id} student={student} />
        ))}
      </div>
    </article>
  );
}

function CreateGroupDropZone() {
  return (
    <div
      className={cn(
        "flex min-h-[300px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#c3c6d7] bg-[#ededf9] p-10 text-center",
        cardShadow
      )}
    >
      <UserPlus className="mb-2 size-12 text-[#737686]" />
      <h3 className="text-lg font-semibold text-[#434655]">Create New Group</h3>
      <p className="mt-1 text-sm text-[#737686]">
        Drag students here to form a manual group.
      </p>
    </div>
  );
}

export function GroupGenerationView({
  classroomName,
  inviteUrl,
}: GroupGenerationViewProps) {
  const [groups] = useState(DEMO_GROUPS);
  const [balancingStrategy, setBalancingStrategy] = useState<string>(
    BALANCING_STRATEGIES[0]
  );
  const [groupSize, setGroupSize] = useState<string>(GROUP_SIZES[0]);
  const [autoAssignLeader, setAutoAssignLeader] = useState(true);

  const copyInvite = async () => {
    if (!inviteUrl) {
      toast.error("Invite link unavailable for this classroom");
      return;
    }
    await navigator.clipboard.writeText(inviteUrl);
    toast.success("Student join link copied");
  };

  const handleRegenerate = () => {
    toast.info("Regenerate will run balancing logic when wired");
  };

  const handleSave = () => {
    toast.info("Save & publish will persist groups when wired");
  };

  return (
    <>
      <OfficerPageHeader />

      <div className="mx-auto w-full max-w-[1280px] flex-1 space-y-6 p-4 md:space-y-8 md:p-6 lg:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#191b23] sm:text-3xl">
              Group Generation
            </h1>
            <p className="mt-1 text-base text-[#434655]">
              Review and adjust auto-generated groups for{" "}
              <span className="font-medium text-[#191b23]">{classroomName}</span>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleRegenerate}
              className="inline-flex items-center gap-2 rounded-lg border border-[#c3c6d7] bg-white px-4 py-2.5 text-sm font-medium text-[#505f76] shadow-sm transition-colors hover:bg-[#f3f3fe]"
            >
              <RefreshCw className="size-[18px]" />
              Regenerate
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#004ac6]"
            >
              <Save className="size-[18px]" />
              Save &amp; Publish Groups
            </button>
          </div>
        </div>

        {inviteUrl && (
          <div
            className={cn(
              "flex flex-col gap-3 rounded-xl border border-[#c3c6d7] bg-white p-4 sm:flex-row sm:items-center sm:justify-between",
              cardShadow
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#dbe1ff]">
                <Link2 className="size-5 text-[#004ac6]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#191b23]">
                  Student join link
                </p>
                <p className="truncate text-sm text-[#505f76]">{inviteUrl}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void copyInvite()}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#c3c6d7] bg-[#f3f3fe] px-4 py-2 text-sm font-medium text-[#004ac6] hover:bg-[#e7e7f3]"
            >
              <Copy className="size-4" />
              Copy join link
            </button>
          </div>
        )}

        <section
          className={cn(
            "rounded-xl border border-[#c3c6d7] bg-white p-6",
            cardShadow
          )}
        >
          <h2 className="mb-4 text-xl font-semibold text-[#191b23]">
            Generation Settings
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <label
                htmlFor="balancing-strategy"
                className="block text-sm font-medium text-[#434655]"
              >
                Balancing Strategy
              </label>
              <select
                id="balancing-strategy"
                className={selectClass}
                value={balancingStrategy}
                onChange={(e) => setBalancingStrategy(e.target.value)}
              >
                {BALANCING_STRATEGIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="group-size"
                className="block text-sm font-medium text-[#434655]"
              >
                Group Size
              </label>
              <select
                id="group-size"
                className={selectClass}
                value={groupSize}
                onChange={(e) => setGroupSize(e.target.value)}
              >
                {GROUP_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between gap-4 pt-0 md:pt-6">
              <div>
                <p className="text-sm font-medium text-[#191b23]">
                  Auto-assign group leader
                </p>
                <p className="text-sm text-[#434655]">
                  Based on historical participation
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={autoAssignLeader}
                  onChange={(e) => setAutoAssignLeader(e.target.checked)}
                />
                <span className="h-6 w-11 rounded-full bg-[#e1e2ed] transition-colors peer-checked:bg-[#2563eb] peer-focus-visible:ring-2 peer-focus-visible:ring-[#004ac6] peer-focus-visible:ring-offset-2 after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-transform peer-checked:after:translate-x-5" />
              </label>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
          <CreateGroupDropZone />
        </div>
      </div>
    </>
  );
}
