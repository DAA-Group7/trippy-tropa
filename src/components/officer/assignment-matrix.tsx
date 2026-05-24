"use client";

import { useMemo, useState } from "react";
import { Grid3X3 } from "lucide-react";
import type { GroupAssignmentMatrix } from "@/lib/tasks/assignment-matrix-data";
import {
  assigneeColorForIndex,
  hexToRgba,
  matchScoreOpacity,
} from "@/lib/tasks/assignment-matrix-colors";
import { cn } from "@/lib/utils";

const cardShadow =
  "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]";

interface AssignmentMatrixProps {
  matrices: GroupAssignmentMatrix[];
}

function matrixHasAssignments(matrix: GroupAssignmentMatrix): boolean {
  return matrix.members.some((member) =>
    matrix.tasks.some((task) => matrix.cells[member.id]?.[task.id]?.isAssigned)
  );
}

function AssignmentHeatmap({ matrix }: { matrix: GroupAssignmentMatrix }) {
  const hasAssignments = matrixHasAssignments(matrix);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 min-w-[120px] bg-[#f3f3fe] px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[#434655]">
              Member
            </th>
            {matrix.tasks.map((task) => (
              <th
                key={task.id}
                className="min-w-[88px] max-w-[120px] px-2 py-2 text-center text-xs font-semibold text-[#434655]"
                title={task.title}
              >
                <span className="line-clamp-2">{task.title}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.members.map((member) => {
            const color = assigneeColorForIndex(member.colorIndex);
            return (
              <tr key={member.id} className="border-t border-[#e7e7f3]">
                <td className="sticky left-0 z-10 bg-white px-3 py-2 font-medium text-[#191b23]">
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                      aria-hidden
                    />
                    <span className="truncate">{member.name}</span>
                  </span>
                </td>
                {matrix.tasks.map((task) => {
                  const cell = matrix.cells[member.id]?.[task.id];
                  if (!cell) {
                    return (
                      <td
                        key={task.id}
                        className="px-1 py-1 text-center text-xs text-[#737686]"
                      >
                        —
                      </td>
                    );
                  }

                  const { estimatedHours, isAssigned, matchScore } = cell;

                  if (isAssigned && matchScore != null) {
                    const fill = matchScoreOpacity(matchScore);
                    return (
                      <td key={task.id} className="p-1">
                        <div
                          className="flex min-h-[52px] flex-col items-center justify-center rounded-lg border-2 px-1 py-1.5 text-center"
                          style={{
                            backgroundColor: hexToRgba(color, fill),
                            borderColor: color,
                          }}
                          title={`Assigned · ${matchScore}% skill match${estimatedHours != null ? ` · ${estimatedHours}h` : ""}`}
                        >
                          <span
                            className="text-xs font-bold"
                            style={{ color }}
                          >
                            {matchScore}%
                          </span>
                          {estimatedHours != null && (
                            <span className="text-[10px] font-medium text-[#434655]">
                              {estimatedHours}h
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  }

                  if (estimatedHours != null) {
                    return (
                      <td key={task.id} className="p-1">
                        <div
                          className="flex min-h-[52px] flex-col items-center justify-center rounded-lg border border-[#e7e7f3] bg-[#faf8ff] px-1 py-1.5 text-center"
                          title={`Member estimate: ${estimatedHours}h`}
                        >
                          <span className="text-xs font-medium text-[#505f76]">
                            {estimatedHours}h
                          </span>
                          <span className="text-[10px] text-[#737686]">est.</span>
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td key={task.id} className="p-1 text-center">
                      <div className="flex min-h-[52px] items-center justify-center rounded-lg border border-dashed border-[#e7e7f3] bg-white text-xs text-[#c3c6d7]">
                        —
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-4 flex flex-col gap-3 border-t border-[#e7e7f3] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-3">
          {matrix.members.map((member) => (
            <span
              key={member.id}
              className="inline-flex items-center gap-1.5 text-xs text-[#434655]"
            >
              <span
                className="size-2.5 rounded-full"
                style={{
                  backgroundColor: assigneeColorForIndex(member.colorIndex),
                }}
                aria-hidden
              />
              {member.name}
            </span>
          ))}
        </div>
        {hasAssignments && (
          <div className="flex items-center gap-2 text-xs text-[#505f76]">
            <span>Match intensity</span>
            <div
              className="h-2 w-24 rounded-full bg-gradient-to-r from-[#dbe1ff] to-[#2563eb]"
              aria-hidden
            />
            <span>Low → High</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function AssignmentMatrix({ matrices }: AssignmentMatrixProps) {
  const visible = useMemo(
    () =>
      matrices.filter(
        (m) => m.members.length > 0 && m.tasks.length > 0
      ),
    [matrices]
  );

  const [activeGroupId, setActiveGroupId] = useState(
    () => visible[0]?.groupId ?? ""
  );

  const activeMatrix =
    visible.find((m) => m.groupId === activeGroupId) ?? visible[0];

  const anyAssignments = visible.some(matrixHasAssignments);

  if (visible.length === 0) {
    return (
      <p className="p-8 text-center text-sm text-[#505f76]">
        Add tasks and group members to view the assignment matrix.
      </p>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {visible.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {visible.map((m) => (
            <button
              key={m.groupId}
              type="button"
              onClick={() => setActiveGroupId(m.groupId)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                activeMatrix?.groupId === m.groupId
                  ? "bg-[#2563eb] text-white"
                  : "bg-[#f3f3fe] text-[#434655] hover:bg-[#e7e7f3]"
              )}
            >
              {m.groupName}
            </button>
          ))}
        </div>
      )}

      {!anyAssignments && (
        <p className="rounded-lg border border-[#c3c6d7] bg-[#faf8ff] px-4 py-3 text-sm text-[#434655]">
          Cells show member time estimates until you run auto-assign. Assigned
          cells will highlight by member color and skill match score.
        </p>
      )}

      {activeMatrix && <AssignmentHeatmap matrix={activeMatrix} />}
    </div>
  );
}

export function AssignmentMatrixSection({
  matrices,
}: AssignmentMatrixProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-[#c3c6d7] bg-white",
        cardShadow
      )}
    >
      <div className="border-b border-[#c3c6d7] px-6 py-4">
        <div className="flex items-center gap-2">
          <Grid3X3 className="size-5 text-[#004ac6]" aria-hidden />
          <div>
            <h2 className="text-lg font-semibold text-[#191b23]">
              Assignment matrix
            </h2>
            <p className="text-sm text-[#434655]">
              Student × task grid — color by assignee, intensity by match score
            </p>
          </div>
        </div>
      </div>
      <AssignmentMatrix matrices={matrices} />
    </div>
  );
}
