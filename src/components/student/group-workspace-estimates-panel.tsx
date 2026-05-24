"use client";

import { useState, useTransition } from "react";
import { Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  upsertTaskTimeEstimate,
  type GroupTimeEstimatesMatrix,
} from "@/app/actions/time-estimates";
import { stitch } from "@/lib/design/stitch";
import { cn } from "@/lib/utils";

interface GroupWorkspaceEstimatesPanelProps {
  matrix: GroupTimeEstimatesMatrix;
}

export function GroupWorkspaceEstimatesPanel({
  matrix,
}: GroupWorkspaceEstimatesPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [localCells, setLocalCells] = useState(matrix.cells);

  const saveCell = (taskId: string, raw: string) => {
    const hours = Number(raw);
    if (!Number.isFinite(hours) || hours <= 0) {
      toast.error("Enter a positive number of hours.");
      return;
    }

    const userId = matrix.currentUserId;
    setLocalCells((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [taskId]: hours },
    }));

    startTransition(async () => {
      const result = await upsertTaskTimeEstimate({ taskId, hours });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Estimate saved");
    });
  };

  if (matrix.tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stitch-border bg-stitch-accent-soft/40 px-6 py-12 text-center">
        <Clock className="mx-auto mb-3 size-10 text-stitch-border" aria-hidden />
        <p className="font-medium text-stitch-text">No project tasks yet</p>
        <p className="mt-2 text-sm text-stitch-text-muted">
          Your instructor will add group tasks (coding, slides, docs, etc.). Then
          each member can enter how long they expect each task to take them.
        </p>
      </div>
    );
  }

  const filled = Object.values(localCells).reduce((sum, row) => {
    return (
      sum +
      matrix.tasks.filter((t) => row[t.id] != null && row[t.id]! > 0).length
    );
  }, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-stitch-text-secondary">
            Each member estimates hours <strong>for themselves</strong> on every
            task. There is no officer-set time limit — your team fills this matrix
            before auto-assignment runs.
          </p>
          <p className="mt-1 text-xs text-stitch-text-muted">
            Edit your row only. Leaders and members use the same flow.
          </p>
        </div>
        <div
          className={cn(
            "shrink-0 rounded-lg px-3 py-2 text-sm font-medium",
            filled === matrix.totalCells && matrix.totalCells > 0
              ? "bg-emerald-50 text-emerald-800"
              : "bg-stitch-accent-soft text-stitch-nav-active"
          )}
        >
          {filled}/{matrix.totalCells} estimates
        </div>
      </div>

      <div
        className={cn(
          "overflow-x-auto rounded-xl border border-stitch-border",
          stitch.cardShadow
        )}
      >
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-stitch-border bg-stitch-accent-soft">
              <th className="sticky left-0 z-10 min-w-[140px] bg-stitch-accent-soft px-3 py-3 font-semibold text-stitch-text">
                Member
              </th>
              {matrix.tasks.map((task) => (
                <th
                  key={task.id}
                  className="min-w-[100px] px-3 py-3 text-xs font-semibold text-stitch-text-secondary"
                >
                  <span className="line-clamp-2" title={task.title}>
                    {task.title}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.members.map((member) => {
              const isSelf = member.id === matrix.currentUserId;
              return (
                <tr
                  key={member.id}
                  className={cn(
                    "border-b border-stitch-border last:border-0",
                    isSelf && "bg-stitch-primary/5"
                  )}
                >
                  <td className="sticky left-0 z-10 bg-inherit px-3 py-2 font-medium text-stitch-text">
                    {member.name}
                    {member.isLeader && (
                      <span className="ml-1 text-xs text-stitch-primary">
                        Leader
                      </span>
                    )}
                    {isSelf && (
                      <span className="ml-1 text-xs text-stitch-text-muted">
                        (you)
                      </span>
                    )}
                  </td>
                  {matrix.tasks.map((task) => {
                    const value = localCells[member.id]?.[task.id];
                    if (isSelf) {
                      return (
                        <td key={task.id} className="px-2 py-2">
                          <div className="relative">
                            <input
                              type="number"
                              min={0.25}
                              max={200}
                              step={0.25}
                              disabled={isPending}
                              className={cn(
                                "w-full min-w-[72px] rounded-lg border border-stitch-border bg-white px-2 py-1.5 pr-7 text-sm text-stitch-text focus:border-stitch-primary focus:outline-none focus:ring-1 focus:ring-stitch-primary disabled:opacity-60"
                              )}
                              placeholder="—"
                              defaultValue={
                                value != null ? String(value) : ""
                              }
                              onBlur={(e) => {
                                const next = e.target.value.trim();
                                if (!next) return;
                                if (
                                  value != null &&
                                  Number(next) === value
                                ) {
                                  return;
                                }
                                saveCell(task.id, next);
                              }}
                            />
                            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-stitch-text-muted">
                              h
                            </span>
                            {isPending && (
                              <Loader2
                                className="absolute -right-1 top-1/2 size-3 -translate-y-1/2 animate-spin text-stitch-text-muted"
                                aria-hidden
                              />
                            )}
                          </div>
                        </td>
                      );
                    }
                    return (
                      <td
                        key={task.id}
                        className="px-3 py-2 text-center text-stitch-text-secondary"
                      >
                        {value != null ? `${value}h` : "—"}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
