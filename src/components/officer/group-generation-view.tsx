"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import {
  CircleHelp,
  Copy,
  GripVertical,
  Link2,
  RefreshCw,
  Save,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import {
  publishGroups,
  type GroupGenerationContext,
  type GroupStudent,
} from "@/app/actions/groups";
import { OfficerPageHeader } from "@/components/layout/officer-page-header";
import {
  BALANCING_STRATEGIES,
  GROUP_SIZES,
} from "@/lib/constants/group-generation-demo";
import {
  assignLeader,
  computeGroupBadge,
  computeGroupCount,
  getVarianceBadgeClass,
  moveStudentToGroup,
  parseGroupSize,
  regenerateGroups,
  varianceLabel,
  type EditableGroup,
} from "@/lib/groups/helpers";
import type { StudentWithSkills } from "@/lib/algorithms/group-balancer";
import { routes } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

const cardShadow =
  "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]";

const selectClass =
  "w-full appearance-none rounded-lg border border-[#c3c6d7] bg-[#faf8ff] px-4 py-2.5 text-base text-[#191b23] focus:border-[#004ac6] focus:outline-none focus:ring-1 focus:ring-[#004ac6]";

interface GroupGenerationViewProps {
  context: GroupGenerationContext;
}

function toStudentWithSkills(students: GroupStudent[]): StudentWithSkills[] {
  return students.map((s) => ({
    id: s.id,
    name: s.name,
    skills: s.skills,
    weightedTotal: s.weightedTotal,
  }));
}

function StudentRowContent({
  student,
  isLeader,
  dragHandleProps,
  isDragging,
  setNodeRef,
}: {
  student: GroupStudent;
  isLeader: boolean;
  dragHandleProps?: Record<string, unknown>;
  isDragging?: boolean;
  setNodeRef?: (node: HTMLElement | null) => void;
}) {
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-center gap-3 rounded-lg border border-transparent p-2 transition-colors hover:border-[#c3c6d7] hover:bg-[#f3f3fe]",
        isDragging && "opacity-40"
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-[#737686] active:cursor-grabbing"
        {...dragHandleProps}
      >
        <GripVertical className="size-5 shrink-0" aria-hidden />
      </button>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#d0e1fb] text-xs font-bold text-[#54647a]">
        {student.initials}
      </div>
      <div>
        <p className="flex items-center gap-1 text-sm font-medium text-[#191b23]">
          {student.name}
          {isLeader && (
            <Star
              className="size-4 fill-[#943700] text-[#943700]"
              aria-label="Group leader"
            />
          )}
        </p>
        <p className="text-sm text-[#434655]">
          Skills avg {student.averageSkill} / 5
        </p>
      </div>
    </div>
  );
}

function DraggableStudent({
  student,
  isLeader,
}: {
  student: GroupStudent;
  isLeader: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: student.id,
  });

  return (
    <StudentRowContent
      student={student}
      isLeader={isLeader}
      dragHandleProps={{ ...attributes, ...listeners }}
      isDragging={isDragging}
      setNodeRef={setNodeRef}
    />
  );
}

function DroppableGroupCard({
  group,
  studentsById,
}: {
  group: EditableGroup;
  studentsById: Map<string, GroupStudent>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: group.id });

  const students = group.memberIds
    .map((id) => studentsById.get(id))
    .filter((s): s is GroupStudent => !!s);

  const skillsMap = new Map(
    students.map((s) => [
      s.id,
      { id: s.id, name: s.name, skills: s.skills } satisfies StudentWithSkills,
    ])
  );

  const badge = computeGroupBadge(group.memberIds, skillsMap);

  return (
    <article
      ref={setNodeRef}
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border bg-white transition-colors",
        cardShadow,
        isOver ? "border-[#004ac6] ring-2 ring-[#004ac6]/20" : "border-[#c3c6d7]"
      )}
    >
      <div className="flex items-center justify-between border-b border-[#c3c6d7] bg-[#f3f3fe] px-4 py-2.5">
        <h3 className="text-lg font-semibold text-[#191b23]">{group.name}</h3>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
            getVarianceBadgeClass(badge)
          )}
        >
          {varianceLabel(badge)}
        </span>
      </div>
      <div className="flex min-h-[120px] flex-1 flex-col gap-1 p-3">
        {students.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#737686]">
            Drop students here
          </p>
        ) : (
          students.map((student) => (
            <DraggableStudent
              key={student.id}
              student={student}
              isLeader={group.leaderId === student.id}
            />
          ))
        )}
      </div>
    </article>
  );
}

export function GroupGenerationView({ context }: GroupGenerationViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [groupSize, setGroupSize] = useState<string>(GROUP_SIZES[0]);
  const [balancingStrategy, setBalancingStrategy] = useState<string>(
    BALANCING_STRATEGIES[0]
  );
  const [autoAssignLeader, setAutoAssignLeader] = useState(true);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);

  const studentsById = useMemo(
    () => new Map(context.students.map((s) => [s.id, s])),
    [context.students]
  );

  const studentsWithSkills = useMemo(
    () => toStudentWithSkills(context.students),
    [context.students]
  );

  const skillsMap = useMemo(
    () => new Map(studentsWithSkills.map((s) => [s.id, s])),
    [studentsWithSkills]
  );

  const initialGroups = useMemo(() => {
    if (context.existingGroups.length > 0) {
      return context.existingGroups;
    }
    const size = parseGroupSize(GROUP_SIZES[0]);
    const count = computeGroupCount(
      context.students.length,
      size,
      context.maxGroups
    );
    if (count === 0) return [];
    return regenerateGroups(studentsWithSkills, count, true);
  }, [context.existingGroups, context.maxGroups, context.students.length, studentsWithSkills]);

  const [groups, setGroups] = useState<EditableGroup[]>(initialGroups);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const activeStudent = activeStudentId
    ? studentsById.get(activeStudentId)
    : null;

  const applyLeaders = useCallback(
    (next: EditableGroup[]) => {
      if (!autoAssignLeader) return next;
      return next.map((g) => ({
        ...g,
        leaderId: assignLeader(g.memberIds, skillsMap, true),
      }));
    },
    [autoAssignLeader, skillsMap]
  );

  const handleRegenerate = useCallback(() => {
    if (balancingStrategy !== BALANCING_STRATEGIES[0]) {
      toast.info(
        "Only greedy load balancing (Skill Balancing Mixed) is available in this version."
      );
    }
    const size = parseGroupSize(groupSize);
    const count = computeGroupCount(
      context.students.length,
      size,
      context.maxGroups
    );
    if (count === 0) {
      toast.error("No eligible students to group.");
      return;
    }
    setGroups(regenerateGroups(studentsWithSkills, count, autoAssignLeader));
    toast.success("Groups regenerated");
  }, [
    autoAssignLeader,
    balancingStrategy,
    context.maxGroups,
    context.students.length,
    groupSize,
    studentsWithSkills,
  ]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveStudentId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveStudentId(null);
    const { active, over } = event;
    if (!over) return;

    const studentId = String(active.id);
    const targetGroupId = String(over.id);

    setGroups((prev) =>
      applyLeaders(
        moveStudentToGroup(prev, studentId, targetGroupId, skillsMap, autoAssignLeader)
      )
    );
  };

  const copyInvite = async () => {
    await navigator.clipboard.writeText(context.inviteUrl);
    toast.success("Student join link copied");
  };

  const handleSave = () => {
    if (groups.length === 0) {
      toast.error("Create at least one group before publishing.");
      return;
    }

    if (groups.some((g) => g.memberIds.length === 0)) {
      toast.error("Each group must have at least one member.");
      return;
    }

    startTransition(async () => {
      const result = await publishGroups({
        classroomId: context.classroomId,
        groups: groups.map((g) => ({
          name: g.name,
          memberIds: g.memberIds,
          leaderId: g.leaderId,
        })),
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Groups published — students can see their assignments");
      router.push(routes.officer.groups(context.classroomId));
      router.refresh();
    });
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
              <span className="font-medium text-[#191b23]">
                {context.classroomName}
              </span>
              .
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={routes.officer.groups(context.classroomId)}
              className="text-sm font-medium text-[#004ac6] hover:underline"
            >
              View published groups
            </Link>
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={context.students.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-[#c3c6d7] bg-white px-4 py-2.5 text-sm font-medium text-[#505f76] shadow-sm transition-colors hover:bg-[#f3f3fe] disabled:opacity-60"
            >
              <RefreshCw className="size-[18px]" />
              Regenerate
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || context.students.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#004ac6] disabled:opacity-60"
            >
              <Save className="size-[18px]" />
              {isPending ? "Publishing…" : "Save & Publish Groups"}
            </button>
          </div>
        </div>

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
              <p className="truncate text-sm text-[#505f76]">
                {context.inviteUrl}
              </p>
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

        {context.students.length === 0 ? (
          <div
            className={cn(
              "rounded-xl border border-dashed border-[#c3c6d7] bg-white p-12 text-center",
              cardShadow
            )}
          >
            <p className="text-lg font-medium text-[#191b23]">
              No students ready for grouping
            </p>
            <p className="mt-2 text-sm text-[#505f76]">
              Students must enroll and complete the skill assessment before
              groups can be generated. Share the join link above.
            </p>
          </div>
        ) : (
          <>
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
                    Target Group Size
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
                      Highest leadership score in each group
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={autoAssignLeader}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setAutoAssignLeader(checked);
                        if (checked) {
                          setGroups((prev) => applyLeaders(prev));
                        }
                      }}
                    />
                    <span className="h-6 w-11 rounded-full bg-[#e1e2ed] transition-colors peer-checked:bg-[#2563eb] after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-transform peer-checked:after:translate-x-5" />
                  </label>
                </div>
              </div>
              <p className="mt-4 text-sm text-[#505f76]">
                {context.students.length} students eligible · greedy load
                balancing (strongest first → lowest group total) · drag members
                between groups to adjust before publishing{" "}
                <Link
                  href={routes.officer.groupBalanceHelp}
                  className="inline-flex items-center gap-1 font-medium text-[#004ac6] hover:underline"
                >
                  <CircleHelp className="size-3.5" aria-hidden />
                  How balancing works
                </Link>
              </p>
            </section>

            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {groups.map((group) => (
                  <DroppableGroupCard
                    key={group.id}
                    group={group}
                    studentsById={studentsById}
                  />
                ))}
              </div>
              <DragOverlay>
                {activeStudent ? (
                  <div className="rounded-lg border border-[#004ac6] bg-white p-2 shadow-lg">
                    <StudentRowContent student={activeStudent} isLeader={false} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </>
        )}
      </div>
    </>
  );
}
