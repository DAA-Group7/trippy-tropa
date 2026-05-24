"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { CreateClassroomSheet } from "@/components/classrooms/create-classroom-sheet";
import { cn } from "@/lib/utils";

const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:bg-[#004ac6] hover:opacity-95";

interface CreateClassroomTriggerProps {
  className?: string;
  label?: string;
  size?: "default" | "compact";
  /** Controlled open state (omit to manage internally). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** When false, parent must render CreateClassroomSheet. */
  withSheet?: boolean;
}

export function CreateClassroomTrigger({
  className,
  label = "Create Classroom",
  size = "default",
  open: controlledOpen,
  onOpenChange,
  withSheet = true,
}: CreateClassroomTriggerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          primaryButtonClass,
          size === "compact" && "px-4 py-2 text-xs",
          className
        )}
      >
        <Plus className={size === "compact" ? "size-4" : "size-[18px]"} />
        {label}
      </button>
      {withSheet ? (
        <CreateClassroomSheet open={open} onOpenChange={setOpen} />
      ) : null}
    </>
  );
}
