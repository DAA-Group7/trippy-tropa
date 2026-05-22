"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, DoorOpen, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { parseInviteCodeFromInput } from "@/lib/invite";
import { routes } from "@/lib/constants/routes";

const inputClass =
  "w-full rounded-lg border border-[#c3c6d7] bg-[#faf8ff] px-4 py-3 text-base text-[#191b23] transition-colors placeholder:text-[#737686] focus:border-[#004ac6] focus:outline-none focus:ring-1 focus:ring-[#004ac6]";

const cardShadow =
  "shadow-[0_10px_15px_-3px_rgba(0,0,0,0.08)]";

interface JoinClassroomFormProps {
  initialCode?: string;
}

export function JoinClassroomForm({ initialCode }: JoinClassroomFormProps) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode ?? "");

  const loginHref = (parsed?: string) => {
    const c = parsed ?? initialCode;
    return c
      ? `${routes.login}?code=${encodeURIComponent(c)}`
      : routes.login;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInviteCodeFromInput(code);
    if (!parsed) {
      toast.error("Enter a valid classroom code or invite link");
      return;
    }

    // UI-only: enrollment logic will be wired later
    toast.info("Join enrollment will connect when auth is wired");
    const onboardingHref = `${routes.onboarding}?code=${encodeURIComponent(parsed)}`;
    router.push(
      `${routes.login}?code=${encodeURIComponent(parsed)}&redirect=${encodeURIComponent(onboardingHref)}`
    );
  };

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
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#004ac6]"
        >
          Join Class
          <ArrowRight className="size-[18px]" />
        </button>
      </form>

      <div className="mt-4 border-t border-[#c3c6d7] pt-4 text-center">
        <Link
          href={loginHref(parseInviteCodeFromInput(code) ?? undefined)}
          className="text-sm font-medium text-[#004ac6] hover:underline"
        >
          Sign in with a different account
        </Link>
      </div>
    </div>
  );
}
