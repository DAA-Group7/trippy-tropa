import { BookOpen } from "lucide-react";
import type { ClassroomPreview } from "@/app/actions/join-classroom";

interface ClassroomPreviewCardProps {
  classroom: ClassroomPreview;
}

export function ClassroomPreviewCard({ classroom }: ClassroomPreviewCardProps) {
  return (
    <div className="flex gap-3 rounded-lg border border-[#004ac6]/20 bg-[#dbe1ff]/40 p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white">
        <BookOpen className="size-5 text-[#004ac6]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-[#004ac6]">
          Classroom found
        </p>
        <p className="truncate text-base font-semibold text-[#191b23]">
          {classroom.name}
        </p>
        {classroom.subject && (
          <p className="text-sm text-[#505f76]">{classroom.subject}</p>
        )}
        <p className="mt-1 font-mono text-xs text-[#737686]">
          {classroom.inviteCode}
        </p>
      </div>
    </div>
  );
}
