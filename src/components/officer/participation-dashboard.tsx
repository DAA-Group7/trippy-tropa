"use client";

import { useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Activity, AlertTriangle, ListChecks, MessageSquare } from "lucide-react";
import type { ClassroomParticipationData } from "@/app/actions/participation";
import { cn } from "@/lib/utils";

const cardShadow =
  "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]";

const axisTick = { fill: "#505f76", fontSize: 12 };
const gridStroke = "#e7e7f3";

interface ParticipationDashboardProps {
  data: ClassroomParticipationData;
}

type SortKey =
  | "name"
  | "lastActive"
  | "messages"
  | "tasksMoved"
  | "atRisk";

function ActivityTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#c3c6d7] bg-white px-3 py-2 text-sm shadow-sm">
      <p className="font-medium text-[#191b23]">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-[#434655]">
          {entry.dataKey === "taskUpdates" ? "Task updates" : "Chat messages"}:{" "}
          <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export function ParticipationDashboard({ data }: ParticipationDashboardProps) {
  const [sortKey, setSortKey] = useState<SortKey>("atRisk");
  const [showAtRiskOnly, setShowAtRiskOnly] = useState(false);

  const chartData = useMemo(
    () =>
      data.activityTrend.map((p) => ({
        label: p.label,
        taskUpdates: p.taskUpdates,
        messages: p.messages,
      })),
    [data.activityTrend]
  );

  const sortedStudents = useMemo(() => {
    let rows = [...data.students];
    if (showAtRiskOnly) {
      rows = rows.filter((s) => s.isAtRisk);
    }

    rows.sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name);
        case "messages":
          return b.messagesSent7d - a.messagesSent7d;
        case "tasksMoved":
          return b.tasksMoved7d - a.tasksMoved7d;
        case "lastActive": {
          const aT = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
          const bT = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
          return bT - aT;
        }
        case "atRisk":
          if (a.isAtRisk !== b.isAtRisk) return a.isAtRisk ? -1 : 1;
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
    return rows;
  }, [data.students, sortKey, showAtRiskOnly]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div
          className={cn(
            "rounded-xl border border-[#c3c6d7] bg-white p-4",
            cardShadow
          )}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[#434655]">
            Active (7 days)
          </p>
          <p className="mt-1 text-2xl font-semibold text-[#191b23]">
            {data.summary.activeLast7d}
            <span className="text-base font-normal text-[#505f76]">
              {" "}
              / {data.summary.enrolled}
            </span>
          </p>
        </div>
        <div
          className={cn(
            "rounded-xl border border-amber-200 bg-amber-50 p-4",
            cardShadow
          )}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
            At risk
          </p>
          <p className="mt-1 text-2xl font-semibold text-amber-950">
            {data.summary.atRiskCount}
          </p>
        </div>
        <div
          className={cn(
            "rounded-xl border border-[#c3c6d7] bg-white p-4",
            cardShadow
          )}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[#434655]">
            Skills assessed
          </p>
          <p className="mt-1 text-2xl font-semibold text-[#191b23]">
            {data.summary.skillsAssessed}
            <span className="text-base font-normal text-[#505f76]">
              {" "}
              / {data.summary.enrolled}
            </span>
          </p>
        </div>
      </div>

      <div
        className={cn(
          "rounded-xl border border-[#c3c6d7] bg-white p-4 sm:p-6",
          cardShadow
        )}
      >
        <div className="mb-4 flex items-center gap-2">
          <Activity className="size-5 text-[#004ac6]" aria-hidden />
          <div>
            <h2 className="text-lg font-semibold text-[#191b23]">
              7-day activity
            </h2>
            <p className="text-sm text-[#434655]">
              Task board updates and group chat messages
            </p>
          </div>
        </div>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="label" tick={axisTick} tickLine={false} />
              <YAxis allowDecimals={false} tick={axisTick} tickLine={false} width={32} />
              <Tooltip content={<ActivityTooltip />} />
              <Line
                type="monotone"
                dataKey="taskUpdates"
                name="taskUpdates"
                stroke="#004ac6"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="messages"
                name="messages"
                stroke="#059669"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#505f76]">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#004ac6]" aria-hidden />
            Task updates
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#059669]" aria-hidden />
            Chat messages
          </span>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-xl border border-[#c3c6d7] bg-white",
          cardShadow
        )}
      >
        <div className="flex flex-col gap-3 border-b border-[#c3c6d7] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <ListChecks className="size-5 text-[#004ac6]" aria-hidden />
            <div>
              <h2 className="text-lg font-semibold text-[#191b23]">
                Student participation
              </h2>
              <p className="text-sm text-[#434655]">
                Per-student engagement to spot who may need a check-in
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-2 text-sm text-[#434655]">
              <input
                type="checkbox"
                checked={showAtRiskOnly}
                onChange={(e) => setShowAtRiskOnly(e.target.checked)}
                className="rounded border-[#c3c6d7]"
              />
              At risk only
            </label>
            <select
              className="rounded-lg border border-[#c3c6d7] bg-[#faf8ff] px-2 py-1.5 text-sm text-[#191b23]"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              aria-label="Sort students"
            >
              <option value="atRisk">Sort: at risk first</option>
              <option value="lastActive">Sort: last active</option>
              <option value="messages">Sort: messages</option>
              <option value="tasksMoved">Sort: task updates</option>
              <option value="name">Sort: name</option>
            </select>
          </div>
        </div>

        {sortedStudents.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#505f76]">
            {showAtRiskOnly
              ? "No at-risk students right now."
              : "No enrolled students yet."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[#f3f3fe] text-xs font-semibold uppercase tracking-wide text-[#434655]">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Group</th>
                  <th className="px-4 py-3">Assessment</th>
                  <th className="px-4 py-3">Last active</th>
                  <th className="px-4 py-3">
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="size-3.5" aria-hidden />
                      Msgs (7d)
                    </span>
                  </th>
                  <th className="px-4 py-3">Task updates (7d)</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7e7f3]">
                {sortedStudents.map((row) => (
                  <tr
                    key={row.userId}
                    className={cn(
                      "hover:bg-[#faf8ff]",
                      row.isAtRisk && "bg-amber-50/60"
                    )}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#191b23]">{row.name}</p>
                      <p className="text-xs text-[#505f76]">{row.email}</p>
                    </td>
                    <td className="px-4 py-3 text-[#434655]">
                      {row.groupName ?? "—"}
                      {row.isLeader && (
                        <span className="ml-1 text-xs text-[#004ac6]">
                          Leader
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          row.skillsCompleted
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-amber-50 text-amber-900"
                        )}
                      >
                        {row.skillsCompleted ? "Complete" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#434655]">
                      {row.lastActiveLabel}
                    </td>
                    <td className="px-4 py-3 text-center text-[#191b23]">
                      {row.messagesSent7d}
                    </td>
                    <td className="px-4 py-3 text-center text-[#191b23]">
                      {row.tasksMoved7d}
                    </td>
                    <td className="px-4 py-3">
                      {row.isAtRisk ? (
                        <span
                          className="inline-flex items-center gap-1 text-xs font-medium text-amber-900"
                          title={row.atRiskReasons.join(" · ")}
                        >
                          <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
                          At risk
                        </span>
                      ) : (
                        <span className="text-xs text-[#505f76]">On track</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
