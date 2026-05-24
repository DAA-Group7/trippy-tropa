"use client";

import { useRouter } from "next/navigation";
import { CreateClassroomForm } from "@/components/classrooms/create-classroom-form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface CreateClassroomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateClassroomSheet({
  open,
  onOpenChange,
}: CreateClassroomSheetProps) {
  const router = useRouter();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <SheetHeader className="shrink-0 border-b border-[#c3c6d7] px-4 py-4 text-left">
          <SheetTitle className="font-heading text-xl text-[#191b23]">
            Create Classroom
          </SheetTitle>
          <SheetDescription className="text-[#434655]">
            Set up a class and generate a student invite link without leaving
            your dashboard.
          </SheetDescription>
        </SheetHeader>
        {open ? (
          <CreateClassroomForm
            variant="sheet"
            onCancel={() => onOpenChange(false)}
            onSuccess={() => {
              router.refresh();
            }}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
