"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  ClipboardList,
  Copy,
  ExternalLink,
  Link2,
  Radar,
  TrendingUp,
  UserPlus,
  Users,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import type { ClassroomDetail } from "@/app/actions/classrooms";
import { OfficerPageHeader } from "@/components/layout/officer-page-header";
import {
  DEMO_CLASS_STATS,
  DEMO_ROSTER_STUDENTS,
  DEMO_SKILL_METRICS,
  type RosterStudent,
} from "@/lib/constants/classroom-detail-demo";
import { routes } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

const cardShadow =
  "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]";

interface ClassroomDetailViewProps {
  classroom: ClassroomDetail | null;
  classroomId: string;
}

function formatSubjectLabel(subject: string | null): string {
  if (!subject) return "General";
  return subject.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function StudentAvatar({ student }: { student: RosterStudent }) {
  if (student.avatarUrl) {
    return (
      <Image
        src={student.avatarUrl}
        alt=""
        width={40}
        height={40}
        className="size-10 rounded-full border border-[#c3c6d7] object-cover"
        unoptimized
      />
    );
  }
  return (
    <div
      className={cn(
        "flex size-10 items-center justify-center rounded-full border border-[#c3c6d7] text-sm font-medium",
        student.avatarClass ?? "bg-[#d0e1fb] text-[#54647a]"
      )}
    >
      {student.initials}
    </div>
  );
}

function StudentRow({ student }: { student: RosterStudent }) {
  return (
    <div className="group flex cursor-pointer items-center justify-between rounded-lg border border-transparent p-4 transition-colors hover:border-[#c3c6d7] hover:bg-[#f3f3fe]">
      <div className="flex items-center gap-4">
        <StudentAvatar student={student} />
        <div>
          <p className="text-sm font-medium text-[#191b23] transition-colors group-hover:text-[#004ac6]">
            {student.name}
          </p>
          <p className="text-sm text-[#434655]">{student.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="hidden text-right sm:block">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#434655]">
            Current Grade
          </p>
          <p className="flex items-center justify-end gap-1 text-base font-medium text-[#191b23]">
            {student.grade}
            {student.gradeWarning && (
              <AlertTriangle className="size-4 text-[#943700]" aria-label="At risk" />
            )}
          </p>
        </div>
        <ChevronRight className="size-5 text-[#737686] transition-colors group-hover:text-[#004ac6]" />
      </div>
    </div>
  );
}

export function ClassroomDetailView({
  classroom,
  classroomId,
}: ClassroomDetailViewProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const name = classroom?.name ?? "Advanced Data Structures";
  const subject = classroom?.subject ?? "computer-science";
  const inviteUrl = classroom?.inviteUrl ?? null;
  const inviteCode = classroom?.inviteCode ?? null;
  const enrolled =
    classroom && classroom.enrolledCount > 0
      ? classroom.enrolledCount
      : DEMO_CLASS_STATS.enrolled;

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return DEMO_ROSTER_STUDENTS;
    return DEMO_ROSTER_STUDENTS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const copyInvite = async () => {
    if (!inviteUrl) {
      toast.error("Invite link unavailable");
      return;
    }
    await navigator.clipboard.writeText(inviteUrl);
    toast.success("Student join link copied");
  };

  const codeTag = inviteCode
    ? inviteCode.slice(0, 6).toUpperCase()
    : "CS-401";

  return (
    <>
      <OfficerPageHeader />

      <div className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 md:px-6 md:py-8 lg:px-10">
        <div className="flex flex-col gap-6">
          <Link
            href={routes.officer.dashboard}
            className="flex w-max items-center gap-1 text-sm font-medium text-[#434655] transition-colors hover:text-[#004ac6]"
          >
            <ArrowLeft className="size-[18px]" />
            Back to Classrooms
          </Link>

          <div className="flex flex-col gap-4 border-b border-[#c3c6d7] pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#d0e1fb] px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-[#54647a]">
                  Fall 2024
                </span>
                <span className="rounded-full bg-[#e7e7f3] px-2.5 py-0.5 text-xs font-semibold text-[#191b23]">
                  {codeTag}
                </span>
              </div>
              <h1 className="font-heading text-4xl font-bold tracking-tight text-[#191b23] sm:text-5xl">
                {name}
              </h1>
              <p className="mt-2 text-lg text-[#434655]">
                Prof. Eleanor Vance • {formatSubjectLabel(subject)} • Mon/Wed
                10:00 AM
              </p>
            </div>
            <Link
              href={routes.officer.generateGroups(classroomId)}
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-[#004ac6] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0053db] md:w-auto"
            >
              <UserPlus className="size-5" />
              Generate Groups
            </Link>
          </div>

          {inviteUrl && (
            <div
              className={cn(
                "flex flex-col gap-4 rounded-xl border border-[#c3c6d7] bg-white p-4 sm:flex-row sm:items-center sm:justify-between",
                cardShadow
              )}
            >
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#dbe1ff]">
                  <Link2 className="size-5 text-[#004ac6]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#191b23]">
                    Student join link
                  </p>
                  <p className="truncate text-sm text-[#505f76]">{inviteUrl}</p>
                  <p className="mt-0.5 text-xs text-[#737686]">
                    Share so students can click to join this classroom
                  </p>
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
                <a
                  href={inviteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#004ac6]"
                >
                  <ExternalLink className="size-4" />
                  Preview join page
                </a>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div
              className={cn(
                "flex items-center gap-4 rounded-xl border border-[#c3c6d7] bg-white p-4 lg:col-span-4",
                cardShadow
              )}
            >
              <div className="flex size-12 items-center justify-center rounded-lg bg-[#f3f3fe] text-[#004ac6]">
                <Users className="size-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#434655]">
                  Total Enrolled
                </p>
                <p className="text-2xl font-semibold text-[#191b23] sm:text-3xl">
                  {enrolled}{" "}
                  <span className="text-base font-normal text-[#505f76]">
                    Students
                  </span>
                </p>
              </div>
            </div>
            <div
              className={cn(
                "flex items-center gap-4 rounded-xl border border-[#c3c6d7] bg-white p-4 lg:col-span-4",
                cardShadow
              )}
            >
              <div className="flex size-12 items-center justify-center rounded-lg bg-[#f3f3fe] text-[#943700]">
                <TrendingUp className="size-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#434655]">
                  Class Average
                </p>
                <p className="text-2xl font-semibold text-[#191b23] sm:text-3xl">
                  {DEMO_CLASS_STATS.classAverage}{" "}
                  <span className="text-base font-normal text-[#505f76]">
                    {DEMO_CLASS_STATS.classAverageLetter}
                  </span>
                </p>
              </div>
            </div>
            <div
              className={cn(
                "flex items-center gap-4 rounded-xl border border-[#c3c6d7] bg-white p-4 lg:col-span-4",
                cardShadow
              )}
            >
              <div className="flex size-12 items-center justify-center rounded-lg bg-[#f3f3fe] text-[#505f76]">
                <ClipboardList className="size-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#434655]">
                  Next Milestone
                </p>
                <p className="text-lg font-semibold text-[#191b23]">
                  {DEMO_CLASS_STATS.milestoneTitle}
                </p>
                <p className="text-sm text-[#ba1a1a]">
                  {DEMO_CLASS_STATS.milestoneDue}
                </p>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div
                className={cn(
                  "flex h-full flex-col rounded-xl border border-[#c3c6d7] bg-white p-6",
                  cardShadow
                )}
              >
                <div className="mb-4 flex items-center gap-2">
                  <Radar className="size-5 text-[#004ac6]" />
                  <h3 className="text-lg font-semibold text-[#191b23]">
                    Collective Skills Matrix
                  </h3>
                </div>
                <p className="mb-6 text-sm text-[#434655]">
                  Aggregated proficiency scores based on prerequisite assessments
                  and current term performance.
                </p>
                <div className="flex flex-1 flex-col justify-center gap-4">
                  {DEMO_SKILL_METRICS.map((skill) => (
                    <div key={skill.label}>
                      <div className="mb-1 flex items-end justify-between">
                        <span className="text-sm font-medium text-[#191b23]">
                          {skill.label}
                        </span>
                        <span className="text-xs font-semibold text-[#505f76]">
                          {skill.percent}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#e1e2ed]">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            skill.barClass
                          )}
                          style={{ width: `${skill.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-8">
              <div
                className={cn(
                  "flex h-full min-h-[480px] flex-col overflow-hidden rounded-xl border border-[#c3c6d7] bg-white",
                  cardShadow
                )}
              >
                <div className="sticky top-0 z-10 flex flex-col gap-4 border-b border-[#c3c6d7] bg-white p-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-[#191b23]">
                      Student Roster
                    </h3>
                    <p className="text-sm text-[#434655]">
                      Manage and view individual performance.
                    </p>
                  </div>
                  <div className="relative w-full md:w-64">
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search students..."
                      className="w-full rounded-lg border border-[#c3c6d7] bg-[#faf8ff] py-2.5 pl-10 pr-4 text-sm text-[#191b23] placeholder:text-[#737686] focus:border-[#004ac6] focus:outline-none focus:ring-1 focus:ring-[#004ac6]"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  <div className="flex flex-col gap-2">
                    {filteredStudents.map((student) => (
                      <StudentRow key={student.id} student={student} />
                    ))}
                    {filteredStudents.length === 0 && (
                      <p className="py-8 text-center text-sm text-[#505f76]">
                        No students match your search.
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-[#c3c6d7] bg-white p-3 text-center">
                  <button
                    type="button"
                    className="w-full rounded-lg py-2 text-sm font-medium text-[#004ac6] transition-colors hover:bg-[#f3f3fe]"
                  >
                    View All {enrolled} Students
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
