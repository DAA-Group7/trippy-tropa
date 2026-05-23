"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function JoinSuccessToast() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const joined = searchParams.get("joined");
    const classroom = searchParams.get("classroom");

    if (!joined || !classroom) return;

    if (joined === "new") {
      toast.success(`You joined ${classroom}`);
    } else if (joined === "already") {
      toast.info(`You are already enrolled in ${classroom}`);
    }

    router.replace("/student/dashboard", { scroll: false });
  }, [searchParams, router]);

  return null;
}
