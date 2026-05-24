"use client";

import { useEffect, useState, useTransition } from "react";
import { UserRoundCog } from "lucide-react";
import { toast } from "sonner";
import {
  overrideTaskAssignment,
  type GroupMemberOption,
} from "@/app/actions/tasks";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-lg border border-[#c3c6d7] bg-[#faf8ff] px-3 py-2 text-sm text-[#191b23] focus:border-[#004ac6] focus:outline-none focus:ring-1 focus:ring-[#004ac6]";

interface TaskAssignmentOverrideDialogProps {
  classroomId: string;
  taskId: string;
  taskTitle: string;
  groupId: string;
  currentAssigneeId: string | null;
  members: GroupMemberOption[];
  triggerLabel?: string;
  triggerClassName?: string;
  /** Controlled open state (e.g. matrix cell click). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export function TaskAssignmentOverrideDialog({
  classroomId,
  taskId,
  taskTitle,
  groupId,
  currentAssigneeId,
  members,
  triggerLabel = "Reassign",
  triggerClassName,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: TaskAssignmentOverrideDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (value: boolean) => {
    if (onOpenChange) onOpenChange(value);
    else setInternalOpen(value);
  };
  const [isPending, startTransition] = useTransition();
  const [assigneeId, setAssigneeId] = useState(
    () =>
      members.find((m) => m.id !== currentAssigneeId)?.id ??
      members[0]?.id ??
      ""
  );
  const [reason, setReason] = useState("");

  const eligibleMembers = members.filter((m) => m.id !== currentAssigneeId);

  useEffect(() => {
    if (!open) return;
    setAssigneeId(
      members.find((m) => m.id !== currentAssigneeId)?.id ??
        members[0]?.id ??
        ""
    );
    setReason("");
  }, [open, currentAssigneeId, members]);

  const handleOpen = () => {
    setAssigneeId(
      members.find((m) => m.id !== currentAssigneeId)?.id ?? members[0]?.id ?? ""
    );
    setReason("");
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!assigneeId) {
      toast.error("Select a group member.");
      return;
    }

    startTransition(async () => {
      const result = await overrideTaskAssignment({
        taskId,
        classroomId,
        newAssigneeId: assigneeId,
        reason: reason.trim() || undefined,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(`Assigned “${taskTitle}”`);
      setOpen(false);
    });
  };

  if (members.length === 0) return null;

  return (
    <>
      {!hideTrigger && (
        <button
          type="button"
          onClick={handleOpen}
          disabled={eligibleMembers.length === 0}
          className={cn(
            "inline-flex items-center gap-1 rounded-lg border border-[#c3c6d7] bg-white px-2.5 py-1 text-xs font-medium text-[#505f76] hover:bg-[#f3f3fe] disabled:opacity-50",
            triggerClassName
          )}
          title={
            eligibleMembers.length === 0
              ? "No other group members to assign"
              : "Manually reassign this task"
          }
        >
          <UserRoundCog className="size-3.5" aria-hidden />
          {triggerLabel}
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="override-dialog-title"
        >
          <div className="w-full max-w-md rounded-xl border border-[#c3c6d7] bg-white p-6 shadow-lg">
            <h3
              id="override-dialog-title"
              className="text-lg font-semibold text-[#191b23]"
            >
              {currentAssigneeId ? "Reassign task" : "Assign task"}
            </h3>
            <p className="mt-1 text-sm text-[#434655]">{taskTitle}</p>

            {eligibleMembers.length === 0 ? (
              <p className="mt-4 text-sm text-[#505f76]">
                No other members in this group to assign.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="space-y-1">
                  <label
                    htmlFor={`assignee-${taskId}`}
                    className="text-sm font-medium text-[#434655]"
                  >
                    Assign to
                  </label>
                  <select
                    id={`assignee-${taskId}`}
                    className={inputClass}
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    disabled={isPending}
                  >
                    {eligibleMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor={`reason-${taskId}`}
                    className="text-sm font-medium text-[#434655]"
                  >
                    Reason (optional)
                  </label>
                  <textarea
                    id={`reason-${taskId}`}
                    className={cn(inputClass, "min-h-[72px] resize-y")}
                    placeholder="e.g. Better fit for documentation work"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={500}
                    disabled={isPending}
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="rounded-lg border border-[#c3c6d7] px-4 py-2 text-sm text-[#434655]"
              >
                Cancel
              </button>
              {eligibleMembers.length > 0 && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#004ac6] disabled:opacity-60"
                >
                  {isPending ? "Saving…" : "Confirm"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
