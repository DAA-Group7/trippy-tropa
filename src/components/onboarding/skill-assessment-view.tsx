"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Info, Link2 } from "lucide-react";
import { toast } from "sonner";
import { completeSkillAssessment } from "@/app/actions/join-classroom";
import {
  ONBOARDING_STEPS,
  RATING_OPTIONS,
  SKILL_DEFINITIONS,
} from "@/lib/constants/skills";
import { buildJoinUrl } from "@/lib/invite";
import { routes } from "@/lib/constants/routes";
import type { SkillKey } from "@/types/database";
import { cn } from "@/lib/utils";

const cardShadow =
  "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]";

const DEFAULT_RATINGS: Record<SkillKey, number> = {
  communication: 3,
  leadership: 2,
  technical: 4,
  teamwork: 3,
};

interface SkillAssessmentViewProps {
  inviteCode?: string;
}

function SkillRatingRow({
  skillKey,
  label,
  tooltip,
  value,
  onChange,
}: {
  skillKey: SkillKey;
  label: string;
  tooltip: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-1 text-lg font-semibold text-[#191b23]">
        {label}
        <span title={tooltip} className="inline-flex">
          <Info className="size-[18px] cursor-help text-[#737686]" />
        </span>
      </label>
      <div className="flex items-center justify-between gap-1 rounded-lg border border-[#c3c6d7] bg-[#f3f3fe] p-2 sm:gap-2">
        {RATING_OPTIONS.map((option) => (
          <label
            key={option.value}
            className="flex-1 cursor-pointer text-center"
          >
            <input
              type="radio"
              name={skillKey}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <div
              className={cn(
                "rounded-md border border-transparent py-2 text-xs text-[#434655] transition-colors sm:text-sm",
                "hover:bg-[#e1e2ed]",
                "peer-checked:border-transparent peer-checked:bg-[#2563eb] peer-checked:font-bold peer-checked:text-white"
              )}
            >
              <span className="hidden sm:inline">{option.label}</span>
              <span className="sm:hidden">
                {option.value === 1 || option.value === 3 || option.value === 5
                  ? option.label
                  : option.shortLabel}
              </span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

function ProgressSteps({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-between border-b border-[#c3c6d7] bg-[#f3f3fe] px-6 py-4">
      {ONBOARDING_STEPS.map((step, index) => {
        const isActive = step.id === currentStep;
        const isPast = step.id < currentStep;
        const showConnector = index < ONBOARDING_STEPS.length - 1;

        return (
          <div key={step.id} className="flex flex-1 items-center">
            <div
              className={cn(
                "flex items-center gap-2",
                !isActive && !isPast && "opacity-50"
              )}
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-sm font-medium",
                  isActive || isPast
                    ? "bg-[#2563eb] text-white"
                    : "bg-[#e1e2ed] text-[#434655]"
                )}
              >
                {step.id}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-medium sm:inline",
                  isActive ? "text-[#191b23]" : "text-[#434655]"
                )}
              >
                {step.label}
              </span>
            </div>
            {showConnector && (
              <div className="mx-2 h-0.5 flex-1 bg-[#c3c6d7] sm:mx-4" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function SkillAssessmentView({ inviteCode }: SkillAssessmentViewProps) {
  const router = useRouter();
  const [wizardStep, setWizardStep] = useState(1);
  const [ratings, setRatings] =
    useState<Record<SkillKey, number>>(DEFAULT_RATINGS);
  const [isPending, startTransition] = useTransition();

  const joinUrl = inviteCode ? buildJoinUrl(inviteCode) : null;

  const setSkillRating = (key: SkillKey, value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  };

  const handleComplete = () => {
    if (wizardStep < 3) {
      setWizardStep((s) => s + 1);
      return;
    }

    startTransition(async () => {
      const result = await completeSkillAssessment(ratings, inviteCode);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(
        inviteCode
          ? "Assessment saved — you have joined the classroom"
          : "Assessment saved"
      );
      router.push(result.redirectTo);
      router.refresh();
    });
  };

  const handleBack = () => {
    if (wizardStep > 1) {
      setWizardStep((s) => s - 1);
      return;
    }
    router.back();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#faf8ff] p-4 md:p-6">
      <div
        className={cn(
          "w-full max-w-[720px] overflow-hidden rounded-xl border border-[#c3c6d7] bg-white",
          cardShadow
        )}
      >
        <div className="border-b border-[#c3c6d7] p-6">
          <h1 className="text-2xl font-semibold tracking-tight text-[#191b23] sm:text-3xl">
            Skill Assessment
          </h1>
          <p className="mt-2 text-base text-[#434655]">
            Please rate your proficiency in the following areas to help us tailor
            your experience.
          </p>
          {inviteCode && joinUrl && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-[#004ac6]/20 bg-[#dbe1ff]/40 p-3">
              <Link2 className="mt-0.5 size-4 shrink-0 text-[#004ac6]" />
              <p className="text-sm text-[#505f76]">
                Complete this assessment to finish joining your classroom.{" "}
                <span className="font-mono text-xs text-[#004ac6]">
                  {inviteCode}
                </span>
              </p>
            </div>
          )}
        </div>

        <ProgressSteps currentStep={wizardStep} />

        <div className="flex flex-col gap-8 p-6">
          {wizardStep === 1 &&
            SKILL_DEFINITIONS.map((skill) => (
              <SkillRatingRow
                key={skill.key}
                skillKey={skill.key}
                label={skill.label}
                tooltip={skill.tooltip}
                value={ratings[skill.key]}
                onChange={(v) => setSkillRating(skill.key, v)}
              />
            ))}

          {wizardStep === 2 && (
            <div className="rounded-lg border border-[#c3c6d7] bg-[#f3f3fe] p-6">
              <h2 className="text-lg font-semibold text-[#191b23]">
                Experience
              </h2>
              <p className="mt-2 text-sm text-[#505f76]">
                Confirm you are ready to use these ratings for balanced group
                placement. You can go back to adjust any skill on step 1.
              </p>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#191b23]">Review</h2>
              <p className="text-sm text-[#505f76]">
                Confirm your skill ratings before submitting.
              </p>
              <ul className="divide-y divide-[#c3c6d7] rounded-lg border border-[#c3c6d7]">
                {SKILL_DEFINITIONS.map((skill) => (
                  <li
                    key={skill.key}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <span className="text-sm font-medium text-[#191b23]">
                      {skill.label}
                    </span>
                    <span className="text-sm text-[#004ac6]">
                      {ratings[skill.key]} / 5
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-[#c3c6d7] bg-white p-6">
          <button
            type="button"
            onClick={handleBack}
            disabled={isPending}
            className="rounded-lg border border-[#c3c6d7] px-6 py-2.5 text-sm font-medium text-[#434655] transition-colors hover:bg-[#e7e7f3] disabled:opacity-60"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleComplete}
            disabled={isPending}
            className="rounded-lg bg-[#2563eb] px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:bg-[#004ac6] hover:opacity-90 disabled:opacity-60"
          >
            {isPending
              ? "Saving…"
              : wizardStep < 3
                ? "Continue"
                : "Complete Assessment"}
          </button>
        </div>
      </div>

      <p className="mt-4 text-center text-sm text-[#505f76]">
        <Link href={routes.home} className="text-[#004ac6] hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
