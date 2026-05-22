"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Filter,
  Link2,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Users,
  AlertTriangle,
  Bell,
} from "lucide-react";
import { toast } from "sonner";
import {
  DEMO_ACTIVE_TASKS,
  DEMO_STUDENT_CLASSROOMS,
  DEMO_UPDATES,
  STUDENT_PROFILE,
} from "@/lib/constants/student-dashboard-demo";
import { routes } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

const cardShadow =
  "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]";

function UpdateIcon({ type }: { type: "group" | "warning" | "forum" }) {
  const config = {
    group: {
      icon: Users,
      bg: "bg-[#dbe1ff]",
      text: "text-[#004ac6]",
    },
    warning: {
      icon: AlertTriangle,
      bg: "bg-[#ffdad6]",
      text: "text-[#ba1a1a]",
    },
    forum: {
      icon: MessageSquare,
      bg: "bg-[#d3e4fe]",
      text: "text-[#505f76]",
    },
  }[type];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex rounded-full p-1.5",
        config.bg,
        config.text
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}

export function StudentDashboardView() {
  const assignmentsDue = 3;

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-[#c3c6d7] bg-white px-4 md:px-6">
        <span className="text-sm font-medium text-[#434655] md:block">
          Dashboard Overview
        </span>
        <span className="text-lg font-bold text-[#004ac6] md:hidden">
          Smart Collaborative
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-full p-2 text-[#004ac6] transition-colors hover:bg-[#e7e7f3]"
            aria-label="Search"
          >
            <Search className="size-5" />
          </button>
          <button
            type="button"
            className="relative rounded-full p-2 text-[#004ac6] transition-colors hover:bg-[#e7e7f3]"
            aria-label="Notifications"
          >
            <Bell className="size-5" />
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#ba1a1a]" />
          </button>
          <Image
            src={STUDENT_PROFILE.avatarUrl}
            alt=""
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
            <h2 className="text-3xl font-bold tracking-tight text-[#191b23] sm:text-4xl md:text-5xl">
              Welcome back, {STUDENT_PROFILE.firstName}.
            </h2>
            <p className="mt-1 text-lg text-[#434655]">
              You have {assignmentsDue} assignments due this week.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={routes.join}
              className="inline-flex items-center gap-1 rounded-lg bg-[#2563eb] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#004ac6]"
            >
              <Link2 className="size-[18px]" />
              Join classroom
            </Link>
            <button
              type="button"
              onClick={() => toast.info("New task — coming soon")}
              className="inline-flex items-center gap-1 rounded-lg bg-[#2563eb] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#004ac6]"
            >
              <Plus className="size-[18px]" />
              New Task
            </button>
            <button
              type="button"
              onClick={() => toast.info("Schedule view — coming soon")}
              className="rounded-lg border border-[#c3c6d7] bg-white px-4 py-2.5 text-sm font-medium text-[#505f76] shadow-sm transition-colors hover:bg-[#f3f3fe]"
            >
              View Schedule
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-6">
          <div className="flex flex-col gap-4 md:col-span-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#191b23]">Active Tasks</h3>
              <button
                type="button"
                className="text-xs font-semibold uppercase tracking-wide text-[#004ac6] hover:underline"
              >
                View All
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {DEMO_ACTIVE_TASKS.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    "flex cursor-pointer flex-col gap-4 rounded-xl border border-[#c3c6d7] bg-white p-4 transition-colors hover:border-[#004ac6]",
                    cardShadow
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
                        task.status === "in_progress"
                          ? "bg-[#d0e1fb] text-[#54647a]"
                          : "bg-[#e7e7f3] text-[#434655]"
                      )}
                    >
                      {task.status === "in_progress" ? "In Progress" : "To Do"}
                    </span>
                    <MoreHorizontal className="size-5 text-[#737686]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-[#191b23]">
                      {task.title}
                    </h4>
                    <p className="mt-1 text-sm text-[#434655]">
                      {task.description}
                    </p>
                  </div>
                  <div className="mt-auto flex items-center gap-2 border-t border-[#c3c6d7] pt-3">
                    <Clock
                      className={cn(
                        "size-4",
                        task.urgent ? "text-[#ba1a1a]" : "text-[#434655]"
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        task.urgent ? "text-[#ba1a1a]" : "text-[#434655]"
                      )}
                    >
                      {task.dueLabel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 md:col-span-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#191b23]">Updates</h3>
              <button
                type="button"
                className="text-[#737686] transition-colors hover:text-[#004ac6]"
                aria-label="Filter"
              >
                <Filter className="size-5" />
              </button>
            </div>
            <div
              className={cn(
                "overflow-hidden rounded-xl border border-[#c3c6d7] bg-white",
                cardShadow
              )}
            >
              {DEMO_UPDATES.map((update, i) => (
                <div
                  key={update.id}
                  className={cn(
                    "flex cursor-pointer gap-3 border-b border-[#c3c6d7] p-4 transition-colors hover:bg-[#f3f3fe]",
                    update.highlighted && "bg-[#f3f3fe]",
                    i === DEMO_UPDATES.length - 1 && "border-b-0"
                  )}
                >
                  <UpdateIcon type={update.icon} />
                  <div>
                    <p className="text-sm text-[#191b23]">
                      {update.highlight && (
                        <span className="font-bold">{update.highlight} </span>
                      )}
                      {update.message}
                    </p>
                    <span className="mt-1 block text-xs text-[#434655]">
                      {update.time}
                    </span>
                  </div>
                </div>
              ))}
              <div className="border-t border-[#c3c6d7] bg-[#e7e7f3] p-3 text-center">
                <button
                  type="button"
                  className="text-xs font-semibold uppercase tracking-wide text-[#004ac6] hover:underline"
                >
                  View All Notifications
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 md:col-span-12">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#191b23]">My Classrooms</h3>
              <Link
                href={routes.join}
                className="text-sm font-medium text-[#004ac6] hover:underline"
              >
                + Join with invite link
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {DEMO_STUDENT_CLASSROOMS.map((classroom) => (
                <Link
                  key={classroom.id}
                  href={routes.student.group(classroom.id)}
                  className={cn(
                    "flex flex-col overflow-hidden rounded-xl border border-[#c3c6d7] bg-white transition-shadow hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.08)]",
                    cardShadow
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
