"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ClipboardList,
  Layers,
  Plus,
  Minus,
  TrendingUp,
  Users,
} from "lucide-react";
import type { OfficerDashboardData } from "@/app/actions/classrooms";
import { OfficerTopBar } from "@/components/layout/officer-top-bar";
import { ClassroomCard, NewClassroomCard } from "@/components/officer/classroom-card";
import { routes } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

const cardShadow =
  "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]";

interface OfficerDashboardViewProps {
  data: OfficerDashboardData;
}

function StatCard({
  label,
  value,
  hint,
  hintIcon: HintIcon,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: number | string;
  hint: string;
  hintIcon: React.ComponentType<{ className?: string }>;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-xl border border-[#c3c6d7] bg-white p-6",
        cardShadow
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-[#505f76]">{label}</span>
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-full",
            iconBg
          )}
        >
          <Icon className={cn("size-[18px]", iconColor)} />
        </div>
      </div>
      <div>
        <span className="text-4xl font-bold tracking-tight text-[#191b23] md:text-5xl">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        <p className="mt-1 flex items-center gap-1 text-sm text-[#505f76]">
          <HintIcon className="size-3.5" />
          {hint}
        </p>
      </div>
    </div>
  );
}

export function OfficerDashboardView({ data }: OfficerDashboardViewProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClassrooms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return data.classrooms;
    return data.classrooms.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.subject ?? "").toLowerCase().includes(q) ||
        c.inviteCode.toLowerCase().includes(q)
    );
  }, [data.classrooms, searchQuery]);

  const formatStudentsHint =
    data.stats.totalStudents > 0
      ? "Enrolled in your classrooms"
      : "Share invite links to enroll students";

  const formatGroupsHint =
    data.stats.groupsCreated > 0
      ? "In your classrooms"
      : "Generate groups from a classroom";

  return (
    <>
      <OfficerTopBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="mx-auto w-full max-w-[1280px] flex-1 p-4 md:p-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#191b23] sm:text-3xl">
              Dashboard Overview
            </h2>
            <p className="mt-1 text-base text-[#434655]">
              Welcome back, {data.officerName}. Here is your academic summary.
            </p>
          </div>
          <Link
            href={routes.officer.createClassroom}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:bg-[#004ac6] hover:opacity-95"
          >
            <Plus className="size-[18px]" />
            Create Classroom
          </Link>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard
            label="Total Students"
            value={data.stats.totalStudents}
            hint={formatStudentsHint}
            hintIcon={TrendingUp}
            icon={Users}
            iconBg="bg-[#dbe1ff]"
            iconColor="text-[#004ac6]"
          />
          <StatCard
            label="Groups Created"
            value={data.stats.groupsCreated}
            hint={formatGroupsHint}
            hintIcon={Minus}
            icon={Layers}
            iconBg="bg-[#d3e4fe]"
            iconColor="text-[#505f76]"
          />
          <StatCard
            label="Active Tasks"
            value={data.stats.activeTasks}
            hint={
              data.stats.tasksNeedingReview > 0
                ? `${data.stats.tasksNeedingReview} requiring immediate review`
                : "No tasks pending review"
            }
            hintIcon={AlertCircle}
            icon={ClipboardList}
            iconBg="bg-[#ffdad6]"
            iconColor="text-[#ba1a1a]"
          />
        </div>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-[#191b23]">
              Created Classrooms
            </h3>
            {data.classrooms.length > 0 && (
              <Link
                href={routes.officer.createClassroom}
                className="text-sm font-medium text-[#004ac6] hover:underline"
              >
                View All
              </Link>
            )}
          </div>

          {filteredClassrooms.length === 0 && data.classrooms.length === 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="col-span-1 rounded-xl border border-dashed border-[#c3c6d7] bg-white p-10 text-center sm:col-span-2">
                <p className="text-lg font-medium text-[#191b23]">
                  No classrooms yet
                </p>
                <p className="mt-2 text-sm text-[#505f76]">
                  Create a classroom to generate a join link students can click
                  to enroll.
                </p>
                <Link
                  href={routes.officer.createClassroom}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#004ac6]"
                >
                  <Plus className="size-4" />
                  Create Classroom
                </Link>
              </div>
              <NewClassroomCard />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredClassrooms.map((classroom, index) => (
                <ClassroomCard
                  key={classroom.id}
                  classroom={classroom}
                  coverIndex={index}
                />
              ))}
              <NewClassroomCard />
            </div>
          )}

          {filteredClassrooms.length === 0 && data.classrooms.length > 0 && (
            <p className="mt-4 text-center text-sm text-[#505f76]">
              No classrooms match &ldquo;{searchQuery}&rdquo;
            </p>
          )}
        </section>
      </div>
    </>
  );
}
