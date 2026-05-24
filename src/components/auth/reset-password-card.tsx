"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { formatAuthErrorMessage } from "@/lib/auth/errors";
import { resolvePostAuthRedirect } from "@/lib/auth/join-flow";
import { APP_NAME } from "@/lib/constants/brand";
import { routes } from "@/lib/constants/routes";
import { createLogger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/database";

const inputClass =
  "w-full rounded-lg border border-[#c3c6d7] bg-white px-4 py-2.5 text-base text-[#191b23] transition-colors placeholder:text-[#737686] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]";

const cardShadow =
  "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]";

const log = createLogger("auth:reset-password");

export function ResetPasswordCard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const submitLock = useRef(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    void createClient()
      .auth.getSession()
      .then(({ data }) => {
        setHasSession(Boolean(data.session));
        setSessionChecked(true);
      });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (submitLock.current || isPending) {
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    startTransition(async () => {
      submitLock.current = true;
      try {
        const supabase = createClient();

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          toast.error(
            "Reset link expired or invalid. Request a new link from sign in."
          );
          return;
        }

        log.info("password_update_attempt");

        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
          log.warn("password_update_failed", {
            code: error.code,
            message: error.message,
          });
          toast.error(formatAuthErrorMessage(error.message, error.code));
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, skills_completed")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profileError || !profile) {
          log.error("profile_missing_after_reset", {
            profileError: profileError?.message,
          });
          toast.success("Password updated. Sign in to continue.");
          router.push(routes.login);
          router.refresh();
          return;
        }

        const destination = resolvePostAuthRedirect(
          profile.role as UserRole,
          profile.skills_completed
        );

        log.info("password_update_success", { destination });
        toast.success("Password updated");
        router.push(destination);
        router.refresh();
      } finally {
        submitLock.current = false;
      }
    });
  };

  if (!sessionChecked) {
    return (
      <div
        className={cn(
          "w-full max-w-md overflow-hidden rounded-lg border border-[#c3c6d7] bg-white px-6 py-12 text-center md:px-8",
          cardShadow
        )}
      >
        <p className="text-sm text-[#434655]">Verifying reset link…</p>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div
        className={cn(
          "w-full max-w-md overflow-hidden rounded-lg border border-[#c3c6d7] bg-white",
          cardShadow
        )}
      >
        <div className="px-6 py-8 text-center md:px-8">
          <h1 className="font-heading text-2xl font-semibold text-[#004ac6]">
            {APP_NAME}
          </h1>
          <p className="mt-3 text-sm text-[#434655]">
            This reset link is invalid or has expired. Request a new link from
            the sign-in page.
          </p>
          <Link
            href={routes.forgotPassword}
            className="mt-6 inline-block text-sm font-semibold text-[#004ac6] hover:underline"
          >
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full max-w-md overflow-hidden rounded-lg border border-[#c3c6d7] bg-white",
        cardShadow
      )}
    >
      <div className="px-6 pb-4 pt-8 text-center md:px-8 md:pt-10">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-[#004ac6] sm:text-3xl">
          {APP_NAME}
        </h1>
        <p className="mt-1 text-base text-[#434655]">
          Choose a new password for your account.
        </p>
      </div>

      <div className="px-6 pb-8 md:px-8">
        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-1">
            <label
              htmlFor="new-password"
              className="text-sm font-medium text-[#191b23]"
            >
              New password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                className={cn(inputClass, "pr-11")}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737686] transition-colors hover:text-[#434655]"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="confirm-password"
              className="text-sm font-medium text-[#191b23]"
            >
              Confirm password
            </label>
            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              className={inputClass}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || !sessionChecked}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:bg-[#004ac6] hover:opacity-95 disabled:opacity-60"
          >
            {isPending ? (
              "Updating…"
            ) : (
              <>
                Update password
                <KeyRound className="size-[18px]" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
