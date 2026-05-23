"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, DoorOpen, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import {
  getClassroomByInviteCode,
  processJoinInvite,
  type ClassroomPreview,
} from "@/app/actions/join-classroom";
import { ClassroomPreviewCard } from "@/components/join/classroom-preview-card";
import { loginWithInvite, registerWithInvite } from "@/lib/auth/join-flow";
import { createLogger } from "@/lib/logger";

const log = createLogger("join:form");
import { parseInviteCodeFromInput } from "@/lib/invite";

const inputClass =
  "w-full rounded-lg border border-[#c3c6d7] bg-[#faf8ff] px-4 py-3 text-base text-[#191b23] transition-colors placeholder:text-[#737686] focus:border-[#004ac6] focus:outline-none focus:ring-1 focus:ring-[#004ac6]";

const cardShadow =
  "shadow-[0_10px_15px_-3px_rgba(0,0,0,0.08)]";

interface JoinClassroomFormProps {
  initialCode?: string;
  initialPreview?: ClassroomPreview | null;
  serverError?: string;
}

export function JoinClassroomForm({
  initialCode,
  initialPreview = null,
  serverError,
}: JoinClassroomFormProps) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode ?? "");
  const [preview, setPreview] = useState<ClassroomPreview | null>(
    initialPreview
  );
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const loginHref = (parsed?: string) => {
    const c = parsed ?? parseInviteCodeFromInput(code) ?? initialCode;
    return c ? loginWithInvite(c) : routes.login;
  };

  useEffect(() => {
    if (serverError) {
      toast.error(serverError);
    }
  }, [serverError]);

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

    if (
      initialPreview &&
      initialPreview.inviteCode.toLowerCase() === parsed.toLowerCase()
    ) {
      return;
    }

    const timer = setTimeout(() => {
      void loadPreview(code);
    }, 400);

    return () => clearTimeout(timer);
  }, [code, initialPreview, loadPreview]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      log.info("submit", { codeLength: code.length });
      const result = await processJoinInvite(code);

      if (!result.ok) {
        log.warn("submit_failed", { error: result.error });
        toast.error(result.error);
        return;
      }

      log.debug("submit_redirect", { redirectTo: result.redirectTo });
      router.push(result.redirectTo);
      router.refresh();
    });
  };

  const parsedCode = parseInviteCodeFromInput(code);

  return (
    <div
      className={`w-full max-w-[480px] rounded-xl border border-[#c3c6d7] bg-white p-6 md:p-8 ${cardShadow}`}
    >
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <div className="mb-2 flex size-16 items-center justify-center rounded-full bg-[#2563eb]/10">
          <DoorOpen className="size-8 text-[#004ac6]" strokeWidth={1.75} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#191b23] md:text-[32px] md:leading-10">
          Join a Classroom
        </h1>
        <p className="text-base text-[#434655]">
          Enter the unique code provided by your instructor to access course
          materials.
        </p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="classroom-code"
            className="text-sm font-medium text-[#191b23]"
          >
            Classroom Code
          </label>
          <input
            id="classroom-code"
            type="text"
            className={inputClass}
            placeholder="e.g., MATH101-FA23"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
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

        <div className="flex gap-3 rounded-lg border border-[#c3c6d7] bg-[#f3f3fe] p-4">
          <HelpCircle className="mt-0.5 size-5 shrink-0 text-[#505f76]" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-[#191b23]">
              Need help finding your code?
            </span>
            <p className="text-sm text-[#434655]">
              Your instructor should have sent this via email or printed it on
              your syllabus. It is typically 6-8 alphanumeric characters.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || !parsedCode}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#004ac6] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Joining…" : "Join Class"}
          <ArrowRight className="size-[18px]" />
        </button>
      </form>

      <div className="mt-4 space-y-2 border-t border-[#c3c6d7] pt-4 text-center">
        {parsedCode ? (
          <>
            <Link
              href={loginHref(parsedCode)}
              className="block text-sm font-medium text-[#004ac6] hover:underline"
            >
              Sign in to join
            </Link>
            <Link
              href={registerWithInvite(parsedCode)}
              className="block text-sm text-[#505f76] hover:text-[#004ac6]"
            >
              Create a student account
            </Link>
          </>
        ) : (
          <Link
            href={routes.login}
            className="text-sm font-medium text-[#004ac6] hover:underline"
          >
            Sign in with a different account
          </Link>
        )}
      </div>
    </div>
  );
}
