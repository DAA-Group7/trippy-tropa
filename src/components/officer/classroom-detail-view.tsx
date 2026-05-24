"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SKILL_DEFINITIONS } from "@/lib/constants/skills";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ArrowLeft,
  ChevronRight,
  ClipboardList,
  Copy,
  ExternalLink,
  Layers,
  Link2,
  Radar,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import type {
  ClassroomDetailFull,
  ClassroomRosterStudent,
} from "@/app/actions/classrooms";
import type {
  ClassroomParticipationData,
  StudentParticipationRow,
} from "@/app/actions/participation";
import { ClassroomAnalyticsCharts } from "@/components/officer/classroom-analytics-charts";
import { ParticipationDashboard } from "@/components/officer/participation-dashboard";
import { OfficerPageHeader } from "@/components/layout/officer-page-header";
import { routes } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

const cardShadow =
  "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]";

interface ClassroomDetailViewProps {
  classroom: ClassroomDetailFull;
  classroomId: string;
  participation: ClassroomParticipationData | null;
}

function formatSubjectLabel(subject: string | null): string {
  if (!subject) return "General";
  return subject.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

function StudentAvatar({ student }: { student: ClassroomRosterStudent }) {
  return (
    <div className="flex size-10 items-center justify-center rounded-full border border-[#c3c6d7] bg-[#d0e1fb] text-sm font-medium text-[#54647a]">
      {initialsFromName(student.name)}
    </div>
  );
}

function StudentRow({
  student,
  onSelect,
}: {
  student: ClassroomRosterStudent;
  onSelect: (student: ClassroomRosterStudent) => void;
}) {
  const skillLabel = student.averageSkill
    ? `${student.averageSkill} / 5 avg`
    : student.skillsCompleted
      ? "Assessed"
      : "Not assessed";

  return (
    <button
      type="button"
      onClick={() => onSelect(student)}
      className="group flex w-full items-center justify-between rounded-lg border border-transparent p-4 text-left transition-colors hover:border-[#c3c6d7] hover:bg-[#f3f3fe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004ac6] focus-visible:ring-offset-2"
    >
      <div className="flex items-center gap-4">
        <StudentAvatar student={student} />
        <div>
          <p className="text-sm font-medium text-[#191b23] transition-colors group-hover:text-[#004ac6]">
            {student.name}
          </p>
          <p className="text-sm text-[#434655]">{student.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden text-right sm:block">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#434655]">
            Skills
          </p>
          <p className="text-base font-medium text-[#191b23]">{skillLabel}</p>
        </div>
        <ChevronRight
          className="size-5 text-[#737686] transition-colors group-hover:text-[#004ac6]"
          aria-hidden
        />
      </div>
    </button>
  );
}

function StudentDetailSheet({
  student,
  participation,
  open,
  onOpenChange,
}: {
  student: ClassroomRosterStudent | null;
  participation: StudentParticipationRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!student) return null;

  const joinedLabel = new Date(student.joinedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{student.name}</SheetTitle>
          <SheetDescription>{student.email}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#505f76]">
              Enrolled
            </p>
            <p className="mt-1 text-sm text-[#191b23]">{joinedLabel}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#505f76]">
              Skill assessment
            </p>
            <p className="mt-1 text-sm text-[#191b23]">
              {student.skillsCompleted
                ? student.averageSkill
                  ? `Complete — ${student.averageSkill} / 5 average`
                  : "Marked complete"
                : "Not completed yet"}
            </p>
          </div>

          {student.skills ? (
            <ul className="space-y-3">
              {SKILL_DEFINITIONS.map((def) => {
                const value = student.skills![def.key];
                const percent = (value / 5) * 100;
                return (
                  <li key={def.key}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium text-[#191b23]">
                        {def.label}
                      </span>
                      <span className="text-[#434655]">{value} / 5</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#e7e7f3]">
                      <div
                        className="h-full rounded-full bg-[#004ac6]"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-[#505f76]">
              This student has not submitted skill ratings yet. They will appear
              here after onboarding.
            </p>
          )}

          {participation && (
            <div className="border-t border-[#e7e7f3] pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#505f76]">
                Participation (7 days)
              </p>
              <ul className="mt-2 space-y-2 text-sm text-[#191b23]">
                <li>
                  Last active:{" "}
                  <span className="font-medium">{participation.lastActiveLabel}</span>
                </li>
                <li>
                  Chat messages:{" "}
                  <span className="font-medium">{participation.messagesSent7d}</span>
                </li>
                <li>
                  Task board updates:{" "}
                  <span className="font-medium">{participation.tasksMoved7d}</span>
                </li>
                <li>
                  Assigned tasks:{" "}
                  <span className="font-medium">
                    {participation.assignedTaskCount}
                  </span>
                </li>
              </ul>
              {participation.isAtRisk && (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950">
                  {participation.atRiskReasons.join(" · ")}
                </p>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ClassroomDetailView({
  classroom,
  classroomId,
  participation,
}: ClassroomDetailViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] =
    useState<ClassroomRosterStudent | null>(null);
  const [studentSheetOpen, setStudentSheetOpen] = useState(false);

  const participationByUserId = useMemo(() => {
    const map = new Map<string, StudentParticipationRow>();
    participation?.students.forEach((row) => map.set(row.userId, row));
    return map;
  }, [participation]);

  const openStudent = (student: ClassroomRosterStudent) => {
    setSelectedStudent(student);
    setStudentSheetOpen(true);
  };

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return classroom.roster;
    return classroom.roster.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [classroom.roster, searchQuery]);

  const copyInvite = async () => {
    await navigator.clipboard.writeText(classroom.inviteUrl);
    toast.success("Student join link copied");
  };

  const codeTag = classroom.inviteCode.slice(0, 8).toUpperCase();

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
                <span className="rounded-full bg-[#e7e7f3] px-2.5 py-0.5 text-xs font-semibold text-[#191b23]">
                  {codeTag}
                </span>
                <span className="rounded-full bg-[#d0e1fb] px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-[#54647a]">
                  {formatSubjectLabel(classroom.subject)}
                </span>
              </div>
              <h1 className="font-heading text-4xl font-bold tracking-tight text-[#191b23] sm:text-5xl">
                {classroom.name}
              </h1>
              <p className="mt-2 text-lg text-[#434655]">
                {classroom.enrolledCount} enrolled · up to {classroom.maxGroups}{" "}
                groups
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
              <Link
                href={routes.officer.generateGroups(classroomId)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#004ac6] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0053db]"
              >
                <UserPlus className="size-5" />
                Generate Groups
              </Link>
              <Link
                href={routes.officer.groups(classroomId)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#c3c6d7] bg-white px-5 py-2.5 text-sm font-medium text-[#004ac6] transition-colors hover:bg-[#f3f3fe]"
              >
                <Layers className="size-5" />
                Manage Groups
              </Link>
              <Link
                href={routes.officer.tasks(classroomId)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#c3c6d7] bg-white px-5 py-2.5 text-sm font-medium text-[#004ac6] transition-colors hover:bg-[#f3f3fe]"
              >
                <ClipboardList className="size-5" />
                Tasks
              </Link>
            </div>
          </div>

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
                <p className="truncate text-sm text-[#505f76]">
                  {classroom.inviteUrl}
                </p>
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
                href={classroom.inviteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#004ac6]"
              >
                <ExternalLink className="size-4" />
                Preview join page
              </a>
            </div>
          </div>

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
                  {classroom.enrolledCount}{" "}
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
              <div className="flex size-12 items-center justify-center rounded-lg bg-[#f3f3fe] text-[#004ac6]">
                <Radar className="size-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#434655]">
                  Skills Assessed
                </p>
                <p className="text-2xl font-semibold text-[#191b23] sm:text-3xl">
                  {classroom.skillsAssessedCount}
                  <span className="text-base font-normal text-[#505f76]">
                    {" "}
                    / {classroom.enrolledCount}
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
                <Layers className="size-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#434655]">
                  Groups Created
                </p>
                <p className="text-2xl font-semibold text-[#191b23] sm:text-3xl">
                  {classroom.groupsCount}
                  <span className="text-base font-normal text-[#505f76]">
                    {" "}
                    / {classroom.maxGroups} max
                  </span>
                </p>
              </div>
            </div>

            <ClassroomAnalyticsCharts classroom={classroom} />

            {participation && (
              <div className="lg:col-span-12">
                <ParticipationDashboard data={participation} />
              </div>
            )}

            <div className="lg:col-span-12">
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
                      Students who joined via your invite link.
                    </p>
                  </div>
                  <div className="relative w-full md:w-64">
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search students..."
                      className="w-full rounded-lg border border-[#c3c6d7] bg-[#faf8ff] py-2.5 pl-4 pr-4 text-sm text-[#191b23] placeholder:text-[#737686] focus:border-[#004ac6] focus:outline-none focus:ring-1 focus:ring-[#004ac6]"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {classroom.roster.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Users className="mb-3 size-10 text-[#c3c6d7]" />
                      <p className="text-sm font-medium text-[#191b23]">
                        No students enrolled yet
                      </p>
                      <p className="mt-1 max-w-sm text-sm text-[#505f76]">
                        Share the join link above so students can enroll and
                        complete their skill assessment.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {filteredStudents.map((student) => (
                        <StudentRow
                          key={student.id}
                          student={student}
                          onSelect={openStudent}
                        />
                      ))}
                      {filteredStudents.length === 0 && (
                        <p className="py-8 text-center text-sm text-[#505f76]">
                          No students match your search.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <StudentDetailSheet
        student={selectedStudent}
        participation={
          selectedStudent
            ? participationByUserId.get(selectedStudent.id) ?? null
            : null
        }
        open={studentSheetOpen}
        onOpenChange={setStudentSheetOpen}
      />
    </>
  );
}
