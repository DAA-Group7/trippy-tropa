"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Link2 } from "lucide-react";
import { toast } from "sonner";
import {
  getClassroomByInviteCode,
  processJoinInvite,
  type ClassroomPreview,
} from "@/app/actions/join-classroom";
import { ClassroomPreviewCard } from "@/components/join/classroom-preview-card";
import { routes } from "@/lib/constants/routes";
import { parseInviteCodeFromInput } from "@/lib/invite";
import { createLogger } from "@/lib/logger";
import { stitch } from "@/lib/design/stitch";
import { cn } from "@/lib/utils";

const log = createLogger("join:inline");

const inputClass =
  "min-w-0 flex-1 rounded-lg border border-[#c3c6d7] bg-[#faf8ff] px-4 py-2.5 text-base text-[#191b23] transition-colors placeholder:text-[#737686] focus:border-[#004ac6] focus:outline-none focus:ring-1 focus:ring-[#004ac6]";

interface JoinClassroomInlineProps {
  className?: string;
  id?: string;
}

export function JoinClassroomInline({ className, id }: JoinClassroomInlineProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState<ClassroomPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const parsedCode = parseInviteCodeFromInput(code);

  const loadPreview = useCallback(async (raw: string) => {
    const parsed = parseInviteCodeFromInput(raw);
    if (!parsed) {
      setPreview(null);
      return;
    }

    setPreviewLoading(true);
    try {
      const classroom = await getClassroomByInviteCode(parsed);
      setPreview(classroom);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  useEffect(() => {
    const parsed = parseInviteCodeFromInput(code);
    if (!parsed) {
      setPreview(null);
      return;
    }

    const timer = setTimeout(() => {
      void loadPreview(code);
    }, 400);

    return () => clearTimeout(timer);
  }, [code, loadPreview]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!parsedCode) {
      toast.error("Enter a valid classroom code or invite link.");
      return;
    }

    startTransition(async () => {
      log.info("dashboard_join_submit", { codeLength: code.length });
      const result = await processJoinInvite(code);

      if (!result.ok) {
        log.warn("dashboard_join_failed", { error: result.error });
        toast.error(result.error);
        return;
      }

      log.debug("dashboard_join_redirect", { redirectTo: result.redirectTo });
      router.push(result.redirectTo);
      router.refresh();
    });
  };

  return (
    <div
      id={id}
      className={cn(
        "rounded-xl border border-stitch-border bg-stitch-surface p-4 md:p-5",
        stitch.cardShadow,
        className
      )}
    >
      <div className="mb-3 flex items-start gap-2">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#dbe1ff] text-[#004ac6]">
          <Link2 className="size-5" aria-hidden />
        </div>
        <div>
          <h4 className="text-base font-semibold text-[#191b23]">
            Join a classroom
          </h4>
          <p className="text-sm text-[#505f76]">
            Paste your instructor&apos;s invite link or enter the classroom code.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="dashboard-join-code" className="sr-only">
            Classroom invite code
          </label>
          <input
            id="dashboard-join-code"
            type="text"
            className={inputClass}
            placeholder="Invite link or code, e.g. 9x2a-b4zq"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={isPending || !parsedCode}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#004ac6] disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[7.5rem]"
          >
            {isPending ? "Joining…" : "Join"}
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>

        {previewLoading && parsedCode && !preview && (
          <p className="text-sm text-[#505f76]">Looking up classroom…</p>
        )}

        {preview && <ClassroomPreviewCard classroom={preview} />}

        {parsedCode && !previewLoading && !preview && (
          <p className="text-sm text-[#ba1a1a]">
            No classroom found for this code. Check with your instructor.
          </p>
        )}
      </form>

      <p className="mt-3 text-xs text-[#505f76]">
        Need the full join page?{" "}
        <Link
          href={routes.join}
          className="font-medium text-[#004ac6] hover:underline"
        >
          Open join classroom
        </Link>
      </p>
    </div>
  );
}
