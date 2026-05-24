"use client";

import Image from "next/image";
import Link from "next/link";
import { Copy, Users } from "lucide-react";
import { toast } from "sonner";
import type { DashboardClassroom } from "@/app/actions/classrooms";
import {
  getClassroomCover,
  getSubjectBadge,
} from "@/lib/constants/classroom-images";
import { routes } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

interface ClassroomCardProps {
  classroom: DashboardClassroom;
  coverIndex: number;
}

export function ClassroomCard({ classroom, coverIndex }: ClassroomCardProps) {
  const badge = getSubjectBadge(classroom.subject);
  const cover = getClassroomCover(coverIndex);
  const subjectLabel =
    classroom.subject?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ??
    "Academic course";

  const copyInvite = async () => {
    await navigator.clipboard.writeText(classroom.inviteUrl);
    toast.success("Student join link copied");
  };

  return (
    <article
      className={cn(
        "rounded-xl border border-[#c3c6d7] bg-white p-4 shadow-sm transition-shadow",
        "hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.08)]"
      )}
    >
      <div className="relative mb-4 h-32 overflow-hidden rounded-lg">
        <Image
          src={cover}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
          <span
            className={cn(
              "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
              badge.className
            )}
          >
            {badge.label}
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold text-white">
            <Users className="size-3.5" />
            {classroom.memberCount}
          </span>
        </div>
      </div>

      <h4 className="truncate text-lg font-semibold text-[#191b23]">
        {classroom.name}
      </h4>
      <p className="mb-4 truncate text-sm text-[#434655]">{subjectLabel}</p>

      <div className="flex items-center justify-between border-t border-[#c3c6d7] pt-3">
        <button
          type="button"
          onClick={() => void copyInvite()}
          className="flex items-center gap-1 text-xs font-semibold text-[#004ac6] hover:underline"
          title={classroom.inviteUrl}
        >
          <Copy className="size-3.5" />
          Copy join link
        </button>
        <Link
          href={routes.officer.classroom(classroom.id)}
          className="text-xs font-semibold text-[#004ac6] hover:underline"
        >
          Manage
        </Link>
      </div>
    </article>
  );
}

interface NewClassroomCardProps {
  onCreateClick?: () => void;
}

export function NewClassroomCard({ onCreateClick }: NewClassroomCardProps) {
  const cardClassName = cn(
    "w-full rounded-xl border border-[#c3c6d7] bg-white p-4 text-left shadow-sm transition-shadow",
    "hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.08)]"
  );

  const inner = (
    <>
      <div className="mb-4 flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-[#c3c6d7] bg-[#e7e7f3] transition-colors hover:bg-[#e1e2ed]">
        <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-[#2563eb] text-white shadow-sm">
          <span className="text-2xl leading-none">+</span>
        </div>
        <span className="text-sm font-medium text-[#505f76]">New Classroom</span>
      </div>
      <h4 className="mb-1 text-lg font-semibold text-[#191b23] opacity-50">
        Create your next class
      </h4>
      <p className="mb-4 text-sm text-[#434655] opacity-50">
        Generate a student invite link instantly
      </p>
      <div className="flex items-center gap-1 border-t border-[#c3c6d7] pt-3 opacity-50">
        <span className="text-xs text-[#505f76]">Tap to set up →</span>
      </div>
    </>
  );

  if (onCreateClick) {
    return (
      <button type="button" onClick={onCreateClick} className={cardClassName}>
        {inner}
      </button>
    );
  }

  return (
    <Link href={routes.officer.createClassroom} className={cardClassName}>
      {inner}
    </Link>
  );
}
