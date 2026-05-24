"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, TrendingUp } from "lucide-react";
import type { ClassroomDetailFull } from "@/app/actions/classrooms";
import {
  buildEnrollmentTrend,
  buildSkillChartData,
  type EnrollmentTrendPoint,
  type SkillChartPoint,
} from "@/lib/officer/classroom-analytics";
import { cn } from "@/lib/utils";

const cardShadow =
  "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]";

const axisTick = { fill: "#505f76", fontSize: 12 };
const gridStroke = "#e7e7f3";

function SkillTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: SkillChartPoint }[];
}) {
  if (!active || !payload?.[0]) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-[#c3c6d7] bg-white px-3 py-2 text-sm shadow-sm">
      <p className="font-medium text-[#191b23]">{point.skill}</p>
      <p className="text-[#434655]">
        Average: <span className="font-semibold">{point.average} / 5</span>
      </p>
    </div>
  );
}

function EnrollmentTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; payload: EnrollmentTrendPoint }[];
  label?: string;
}) {
  if (!active || !payload?.[0]) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-[#c3c6d7] bg-white px-3 py-2 text-sm shadow-sm">
      <p className="font-medium text-[#191b23]">{label}</p>
      <p className="text-[#434655]">
        Total enrolled:{" "}
        <span className="font-semibold">{point.enrolled}</span>
      </p>
      {point.joinsThatDay > 0 && (
        <p className="text-xs text-[#505f76]">
          +{point.joinsThatDay} joined this day
        </p>
      )}
    </div>
  );
}

interface ClassroomAnalyticsChartsProps {
  classroom: ClassroomDetailFull;
}

export function ClassroomAnalyticsCharts({
  classroom,
}: ClassroomAnalyticsChartsProps) {
  const skillData = useMemo(
    () => buildSkillChartData(classroom.skillMetrics),
    [classroom.skillMetrics]
  );
  const enrollmentData = useMemo(
    () => buildEnrollmentTrend(classroom.roster),
    [classroom.roster]
  );

  const hasSkillData = classroom.skillMetrics.some((s) => s.average > 0);
  const hasEnrollmentData = enrollmentData.length > 0;

  return (
    <section
      className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:col-span-12"
      aria-label="Classroom analytics"
    >
      <div
        className={cn(
          "flex flex-col rounded-xl border border-[#c3c6d7] bg-white p-6",
          cardShadow
        )}
      >
        <div className="mb-1 flex items-center gap-2">
          <BarChart3 className="size-5 text-[#004ac6]" aria-hidden />
          <h3 className="text-lg font-semibold text-[#191b23]">
            Skill distribution
          </h3>
        </div>
        <p className="mb-4 text-sm text-[#434655]">
          Average self-assessed proficiency (1–5) across students who completed
          onboarding.
        </p>
        {hasSkillData ? (
          <div
            className="h-[280px] w-full"
            role="img"
            aria-label="Bar chart of average skill ratings by category"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={skillData}
                margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={gridStroke}
                />
                <XAxis
                  dataKey="skill"
                  tick={axisTick}
                  tickLine={false}
                  axisLine={{ stroke: gridStroke }}
                  interval={0}
                  angle={-12}
                  textAnchor="end"
                  height={56}
                />
                <YAxis
                  domain={[0, 5]}
                  ticks={[0, 1, 2, 3, 4, 5]}
                  tick={axisTick}
                  tickLine={false}
                  axisLine={{ stroke: gridStroke }}
                  width={32}
                />
                <Tooltip
                  content={<SkillTooltip />}
                  cursor={{ fill: "rgba(0, 74, 198, 0.06)" }}
                />
                <Bar
                  dataKey="average"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="flex min-h-[200px] flex-1 items-center justify-center text-center text-sm text-[#505f76]">
            No skill assessments yet. Students appear here after they complete
            onboarding.
          </p>
        )}
      </div>

      <div
        className={cn(
          "flex flex-col rounded-xl border border-[#c3c6d7] bg-white p-6",
          cardShadow
        )}
      >
        <div className="mb-1 flex items-center gap-2">
          <TrendingUp className="size-5 text-[#004ac6]" aria-hidden />
          <h3 className="text-lg font-semibold text-[#191b23]">
            Enrollment trend
          </h3>
        </div>
        <p className="mb-4 text-sm text-[#434655]">
          Cumulative students who joined via your invite link over time.
        </p>
        {hasEnrollmentData ? (
          <div
            className="h-[280px] w-full"
            role="img"
            aria-label="Line chart of cumulative enrollment over time"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={enrollmentData}
                margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={gridStroke}
                />
                <XAxis
                  dataKey="label"
                  tick={axisTick}
                  tickLine={false}
                  axisLine={{ stroke: gridStroke }}
                  minTickGap={24}
                />
                <YAxis
                  allowDecimals={false}
                  tick={axisTick}
                  tickLine={false}
                  axisLine={{ stroke: gridStroke }}
                  width={32}
                />
                <Tooltip content={<EnrollmentTooltip />} />
                <Line
                  type="monotone"
                  dataKey="enrolled"
                  stroke="#004ac6"
                  strokeWidth={2}
                  dot={{ fill: "#004ac6", r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#2563eb" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="flex min-h-[200px] flex-1 items-center justify-center text-center text-sm text-[#505f76]">
            No enrollments yet. Share your join link to see growth over time.
          </p>
        )}
      </div>
    </section>
  );
}
