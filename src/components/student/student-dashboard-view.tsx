"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Clock, Link2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import type { NotificationItem } from "@/app/actions/notifications";
import type {
  StudentDashboardActiveTask,
  StudentDashboardClassroom,
} from "@/app/actions/student-dashboard";
import { STUDENT_PROFILE } from "@/lib/constants/student-dashboard-demo";
import { BrandTitle } from "@/components/brand/brand-mark";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { JoinClassroomInline } from "@/components/student/join-classroom-inline";
import { useNotificationsRealtime } from "@/hooks/use-notifications-realtime";
import { stitch } from "@/lib/design/stitch";
import { routes } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

interface StudentDashboardViewProps {
  userId: string;
  studentFirstName: string;
  initialNotifications: NotificationItem[];
  classrooms: StudentDashboardClassroom[];
  activeTasks: StudentDashboardActiveTask[];
}

export function StudentDashboardView({
  userId,
  studentFirstName,
  initialNotifications,
  classrooms,
  activeTasks,
}: StudentDashboardViewProps) {
  const { items, setItems } = useNotificationsRealtime(
    userId,
    initialNotifications
  );
  const searchParams = useSearchParams();
  const router = useRouter();
  const assignmentsDue = activeTasks.length;

  useEffect(() => {
    const joined = searchParams.get("joined");
    const classroom = searchParams.get("classroom");
    if (!joined || !classroom) return;

    const name = decodeURIComponent(classroom);
    if (joined === "new") {
      toast.success(`You joined ${name}`);
    } else if (joined === "already") {
      toast.info(`You’re already in ${name}`);
    }

    router.replace(routes.student.dashboard, { scroll: false });
  }, [searchParams, router]);

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-[#c3c6d7] bg-white px-4 md:px-6">
        <span className="text-sm font-medium text-[#434655] md:block">
          Dashboard Overview
        </span>
        <BrandTitle className="text-lg md:hidden" />
        <div className="flex items-center gap-2">
          <div className="md:hidden">
            <SignOutButton variant="compact" />
          </div>
          {userId ? (
            <NotificationsBell
              items={items}
              onItemsChange={setItems}
              iconClassName="text-[#004ac6]"
            />
          ) : null}
          <Image
            src={STUDENT_PROFILE.avatarUrl}
            alt={`${studentFirstName} profile`}
            width={32}
            height={32}
            className="size-8 cursor-pointer rounded-full border border-[#c3c6d7] object-cover"
            unoptimized
          />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6 lg:p-8">
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-[#191b23] sm:text-4xl md:text-5xl">
              Welcome back, {studentFirstName}.
            </h2>
            <p className="mt-1 text-lg text-stitch-text-secondary">
              {assignmentsDue === 0
                ? "No open assignments right now."
                : `You have ${assignmentsDue} open assignment${assignmentsDue === 1 ? "" : "s"}.`}
            </p>
          </div>
          <a
            href="#join-classroom"
            className="inline-flex items-center gap-1 rounded-lg bg-[#2563eb] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#004ac6]"
          >
            <Link2 className="size-[18px]" />
            Join classroom
          </a>
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-6">
          <div className="flex flex-col gap-4 md:col-span-8">
            <h3 className="text-lg font-semibold text-[#191b23]">Active Tasks</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {activeTasks.length === 0 ? (
                <p
                  className={cn(
                    "col-span-full rounded-xl border border-dashed border-stitch-border bg-stitch-surface p-8 text-center text-sm text-stitch-text-muted sm:col-span-2",
                    stitch.cardShadow
                  )}
                >
                  No active tasks yet. Join a classroom below with your
                  instructor&apos;s invite code.
                </p>
              ) : (
                activeTasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "flex flex-col gap-4 rounded-xl border border-stitch-border bg-stitch-surface p-4",
                      stitch.cardShadow
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <span className="rounded-full bg-stitch-accent-muted px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-stitch-text-secondary">
                        {task.classroom}
                      </span>
                      <MoreHorizontal
                        className="size-5 text-stitch-text-nav"
                        aria-hidden
                      />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-stitch-text">
                        {task.title}
                      </h4>
                    </div>
                    <div className="mt-auto flex items-center gap-2 border-t border-stitch-border pt-3">
                      <Clock
                        className={cn(
                          "size-4",
                          task.urgent
                            ? "text-stitch-destructive"
                            : "text-stitch-text-secondary"
                        )}
                        aria-hidden
                      />
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          task.urgent
                            ? "text-stitch-destructive"
                            : "text-stitch-text-secondary"
                        )}
                      >
                        Due {task.dueLabel}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div
            id="updates"
            className="flex flex-col gap-4 md:col-span-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#191b23]">Updates</h3>
              {items.some((n) => !n.read) && (
                <span className="text-xs font-medium text-[#004ac6]">
                  {items.filter((n) => !n.read).length} unread
                </span>
              )}
            </div>
            <div
              className={cn(
                "overflow-hidden rounded-xl border border-stitch-border bg-stitch-surface",
                stitch.cardShadow
              )}
            >
              <NotificationsList
                items={items}
                onItemsChange={setItems}
                emptyMessage="No updates yet. Join a classroom or wait for group and task assignments."
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 md:col-span-12">
            <h3 className="text-lg font-semibold text-[#191b23]">My Classrooms</h3>
            <JoinClassroomInline id="join-classroom" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {classrooms.length === 0 ? (
                <p
                  className={cn(
                    "col-span-full rounded-xl border border-dashed border-stitch-border p-8 text-center text-sm text-stitch-text-muted",
                    stitch.cardShadow
                  )}
                >
                  You are not enrolled yet. Enter an invite code in the form
                  above to join your first class.
                </p>
              ) : (
                classrooms.map((classroom) => (
                <Link
                  key={classroom.id}
                  href={routes.student.group(classroom.id)}
                  className={cn(
                    "group flex flex-col overflow-hidden rounded-xl border border-stitch-border bg-stitch-surface transition-shadow hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.08)]",
                    stitch.cardShadow
                  )}
                >
                  <div
                    className={cn(
                      "flex h-24 flex-col justify-end bg-gradient-to-r p-4",
                      classroom.headerClass
                    )}
                  >
                    <h4 className="text-lg font-semibold text-white">
                      {classroom.code}
                    </h4>
                    <span
                      className={cn(
                        "text-xs font-semibold uppercase tracking-wide",
                        classroom.subtitleClass
                      )}
                    >
                      {classroom.subtitle}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <p className="text-sm text-[#434655]">{classroom.professor}</p>
                    <div className="mt-auto flex items-center justify-between border-t border-[#c3c6d7] pt-3">
                      <span className="text-xs font-semibold text-[#505f76]">
                        {classroom.pendingTasks === 0
                          ? "No pending tasks"
                          : `${classroom.pendingTasks} pending task${classroom.pendingTasks > 1 ? "s" : ""}`}
                      </span>
                      <ArrowRight className="size-5 text-[#737686] transition-colors group-hover:text-[#004ac6]" />
                    </div>
                  </div>
                </Link>
              )))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
