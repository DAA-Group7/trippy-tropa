"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import {
  autoAssignTasks,
  createTask,
  deleteTask,
  type OfficerTasksContext,
} from "@/app/actions/tasks";
import { AssignmentMatrixSection } from "@/components/officer/assignment-matrix";
import { TaskAssignmentOverrideDialog } from "@/components/officer/task-assignment-override-dialog";
import { OfficerPageHeader } from "@/components/layout/officer-page-header";
import {
  SKILL_KEYS,
  SKILL_LABELS,
  formatRequiredSkills,
  statusLabel,
} from "@/lib/tasks/helpers";
import type { SkillKey } from "@/types/database";
import { routes } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

const cardShadow =
  "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]";

const inputClass =
  "w-full rounded-lg border border-[#c3c6d7] bg-[#faf8ff] px-3 py-2 text-sm text-[#191b23] focus:border-[#004ac6] focus:outline-none focus:ring-1 focus:ring-[#004ac6]";

interface OfficerTasksViewProps {
  context: OfficerTasksContext;
}

export function OfficerTasksView({ context }: OfficerTasksViewProps) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [groupId, setGroupId] = useState(context.groups[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [primarySkill, setPrimarySkill] = useState<SkillKey>("technical");
  const [skillWeight, setSkillWeight] = useState("4");

  const handleCreate = () => {
    if (!groupId) {
      toast.error("Create groups before adding tasks.");
      return;
    }
    if (!title.trim()) {
      toast.error("Enter a task title.");
      return;
    }

    startTransition(async () => {
      const result = await createTask(context.classroomId, {
        groupId,
        title: title.trim(),
        description: description.trim() || undefined,
        deadline: deadline || undefined,
        requiredSkills: {
          [primarySkill]: Number(skillWeight),
        },
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Task created");
      setTitle("");
      setDescription("");
      setShowForm(false);
    });
  };

  const handleAutoAssign = () => {
    startTransition(async () => {
      const result = await autoAssignTasks(context.classroomId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Assigned ${result.assignedCount} tasks optimally`);
    });
  };

  const handleDelete = (taskId: string, taskTitle: string) => {
    if (!confirm(`Delete "${taskTitle}"?`)) return;

    startTransition(async () => {
      const result = await deleteTask(taskId, context.classroomId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Task deleted");
    });
  };

  return (
    <>
      <OfficerPageHeader />

      <div className="mx-auto w-full max-w-[1280px] flex-1 space-y-6 p-4 md:p-8">
        <Link
          href={routes.officer.classroom(context.classroomId)}
          className="inline-flex items-center gap-1 text-sm font-medium text-[#434655] hover:text-[#004ac6]"
        >
          <ArrowLeft className="size-4" />
          Back to classroom
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#505f76]">
              {context.classroomName}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-[#191b23] sm:text-3xl">
              Task management
            </h1>
            <p className="mt-1 text-sm text-[#434655]">
              Create project tasks per group. Students fill a time estimate matrix;
              auto-assign uses their self-reported hours.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAutoAssign}
              disabled={
                isPending ||
                context.groups.length === 0 ||
                (context.estimateStatus.totalCells > 0 &&
                  !context.estimateStatus.isComplete)
              }
              title={
                context.estimateStatus.totalCells > 0 &&
                !context.estimateStatus.isComplete
                  ? "Waiting for all group members to complete time estimates"
                  : undefined
              }
              className="inline-flex items-center gap-2 rounded-lg border border-[#c3c6d7] bg-white px-4 py-2.5 text-sm font-medium text-[#505f76] hover:bg-[#f3f3fe] disabled:opacity-60"
            >
              <Wand2 className="size-4" />
              Auto assign tasks
            </button>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              disabled={context.groups.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#004ac6] disabled:opacity-60"
            >
              <Plus className="size-4" />
              New task
            </button>
          </div>
        </div>

        {context.groups.length === 0 ? (
          <div
            className={cn(
              "rounded-xl border border-dashed border-[#c3c6d7] bg-white p-10 text-center",
              cardShadow
            )}
          >
            <p className="font-medium text-[#191b23]">No groups yet</p>
            <p className="mt-2 text-sm text-[#505f76]">
              Publish groups before creating tasks.
            </p>
            <Link
              href={routes.officer.generateGroups(context.classroomId)}
              className="mt-4 inline-block text-sm font-medium text-[#004ac6] hover:underline"
            >
              Generate groups
            </Link>
          </div>
        ) : (
          <>
            {context.estimateStatus.totalCells > 0 && (
              <div
                className={cn(
                  "rounded-xl border px-4 py-3 text-sm",
                  context.estimateStatus.isComplete
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-amber-200 bg-amber-50 text-amber-950"
                )}
              >
                <p className="font-medium">
                  Time estimate matrix:{" "}
                  {context.estimateStatus.filledCells}/
                  {context.estimateStatus.totalCells} cells complete
                </p>
                {!context.estimateStatus.isComplete && (
                  <p className="mt-1 text-xs opacity-90">
                    Each group member must enter hours for every task in their
                    group before auto-assign runs.
                  </p>
                )}
              </div>
            )}

            {showForm && (
              <div
                className={cn(
                  "rounded-xl border border-[#c3c6d7] bg-white p-6",
                  cardShadow
                )}
              >
                <h2 className="mb-4 text-lg font-semibold text-[#191b23]">
                  New task
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-sm font-medium text-[#434655]">
                      Group
                    </label>
                    <select
                      className={inputClass}
                      value={groupId}
                      onChange={(e) => setGroupId(e.target.value)}
                    >
                      {context.groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-sm font-medium text-[#434655]">
                      Title
                    </label>
                    <input
                      className={inputClass}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Research outline"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-sm font-medium text-[#434655]">
                      Description (optional)
                    </label>
                    <textarea
                      className={cn(inputClass, "min-h-[80px]")}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-sm font-medium text-[#434655]">
                      Deadline (optional)
                    </label>
                    <input
                      type="date"
                      className={inputClass}
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-[#434655]">
                      Primary skill
                    </label>
                    <select
                      className={inputClass}
                      value={primarySkill}
                      onChange={(e) =>
                        setPrimarySkill(e.target.value as SkillKey)
                      }
                    >
                      {SKILL_KEYS.map((k) => (
                        <option key={k} value={k}>
                          {SKILL_LABELS[k]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-[#434655]">
                      Skill weight (1–5)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      className={inputClass}
                      value={skillWeight}
                      onChange={(e) => setSkillWeight(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-lg border border-[#c3c6d7] px-4 py-2 text-sm text-[#434655]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={isPending}
                    className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#004ac6] disabled:opacity-60"
                  >
                    {isPending ? "Saving…" : "Create task"}
                  </button>
                </div>
              </div>
            )}

            <div
              className={cn(
                "overflow-hidden rounded-xl border border-[#c3c6d7] bg-white",
                cardShadow
              )}
            >
              <div className="border-b border-[#c3c6d7] px-6 py-4">
                <h2 className="text-lg font-semibold text-[#191b23]">
                  Tasks ({context.tasks.length})
                </h2>
              </div>
              {context.tasks.length === 0 ? (
                <p className="p-8 text-center text-sm text-[#505f76]">
                  No tasks yet. Create tasks then run auto-assign.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#f3f3fe] text-xs font-semibold uppercase tracking-wide text-[#434655]">
                      <tr>
                        <th className="px-4 py-3">Task</th>
                        <th className="px-4 py-3">Group</th>
                        <th className="px-4 py-3">Assignee</th>
                        <th className="px-4 py-3">Skills</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Assign</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#c3c6d7]">
                      {context.tasks.map((task) => (
                        <tr key={task.id} className="hover:bg-[#faf8ff]">
                          <td className="px-4 py-3 font-medium text-[#191b23]">
                            {task.title}
                          </td>
                          <td className="px-4 py-3 text-[#434655]">
                            {task.groupName}
                          </td>
                          <td className="px-4 py-3 text-[#434655]">
                            {task.assigneeName ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-[#505f76]">
                            {formatRequiredSkills(task.requiredSkills)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-[#e7e7f3] px-2 py-0.5 text-xs font-medium">
                              {statusLabel(task.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <TaskAssignmentOverrideDialog
                              classroomId={context.classroomId}
                              taskId={task.id}
                              taskTitle={task.title}
                              groupId={task.groupId}
                              currentAssigneeId={task.assignedTo}
                              members={
                                context.groupMembersByGroupId[task.groupId] ??
                                []
                              }
                              triggerLabel={
                                task.assignedTo ? "Reassign" : "Assign"
                              }
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDelete(task.id, task.title)}
                              className="rounded p-1 text-[#737686] hover:bg-[#ffdad6] hover:text-[#ba1a1a]"
                              aria-label="Delete task"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <AssignmentMatrixSection
              matrices={context.assignmentMatrices}
              classroomId={context.classroomId}
              groupMembersByGroupId={context.groupMembersByGroupId}
            />

            <div
              className={cn(
                "overflow-hidden rounded-xl border border-[#c3c6d7] bg-white",
                cardShadow
              )}
            >
              <div className="border-b border-[#c3c6d7] px-6 py-4">
                <h2 className="text-lg font-semibold text-[#191b23]">
                  Assignment details
                </h2>
                <p className="text-sm text-[#434655]">
                  Uses each assignee&apos;s self-reported hours from the group matrix
                </p>
              </div>
              {context.assignmentRows.length === 0 ? (
                <p className="p-8 text-center text-sm text-[#505f76]">
                  Run auto-assign to populate optimized results.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#f3f3fe] text-xs font-semibold uppercase tracking-wide text-[#434655]">
                      <tr>
                        <th className="px-4 py-3">Student</th>
                        <th className="px-4 py-3">Task</th>
                        <th className="px-4 py-3">Group</th>
                        <th className="px-4 py-3">Member est.</th>
                        <th className="px-4 py-3">Match</th>
                        <th className="px-4 py-3">Rationale</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#c3c6d7]">
                      {context.assignmentRows.map((row) => (
                        <tr key={row.taskId} className="hover:bg-[#faf8ff]">
                          <td className="px-4 py-3 font-medium text-[#191b23]">
                            {row.studentName}
                          </td>
                          <td className="px-4 py-3">{row.taskTitle}</td>
                          <td className="px-4 py-3 text-[#434655]">
                            {row.groupName}
                          </td>
                          <td className="px-4 py-3">{row.estimatedHours}h</td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-[#004ac6]">
                              {row.matchScore}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-[#505f76]">
                            {row.reason}
                          </td>
                          <td className="px-4 py-3">
                            <TaskAssignmentOverrideDialog
                              classroomId={context.classroomId}
                              taskId={row.taskId}
                              taskTitle={row.taskTitle}
                              groupId={row.groupId}
                              currentAssigneeId={row.studentId}
                              members={
                                context.groupMembersByGroupId[row.groupId] ??
                                []
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
