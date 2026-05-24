"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";
import { authCallbackUrl } from "@/lib/auth/redirect";
import { normalizeEmail, parseEmail } from "@/lib/auth/email";
import {
  formatAuthErrorMessage,
  isAuthRateLimitError,
} from "@/lib/auth/errors";
import { getAppBaseUrl } from "@/lib/invite";
import { APP_NAME } from "@/lib/constants/brand";
import { routes } from "@/lib/constants/routes";
import { createLogger, maskEmail } from "@/lib/logger";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-lg border border-[#c3c6d7] bg-white px-4 py-2.5 text-base text-[#191b23] transition-colors placeholder:text-[#737686] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]";

const cardShadow =
  "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]";

const log = createLogger("auth:forgot-password");

function loginHref(inviteCode?: string, redirect?: string) {
  const params = new URLSearchParams();
  if (inviteCode) params.set("code", inviteCode);
  if (redirect) params.set("redirect", redirect);
  const q = params.toString();
  return q ? `${routes.login}?${q}` : routes.login;
}

interface ForgotPasswordCardProps {
  inviteCode?: string;
  redirect?: string;
}

export function ForgotPasswordCard({
  inviteCode,
  redirect,
}: ForgotPasswordCardProps) {
  const [isPending, startTransition] = useTransition();
  const submitLock = useRef(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (submitLock.current || isPending) {
      return;
    }

    const parsedEmail = parseEmail(email);
    if (!parsedEmail.ok) {
      toast.error(parsedEmail.error);
      return;
    }

    const normalizedEmail = parsedEmail.email;

    startTransition(async () => {
      submitLock.current = true;
      try {
        const supabase = createClient();
        const redirectTo = `${getAppBaseUrl()}${authCallbackUrl(routes.resetPassword)}`;

        log.info("reset_email_request", {
          email: maskEmail(normalizedEmail),
        });

        const { error } = await supabase.auth.resetPasswordForEmail(
          normalizedEmail,
          { redirectTo }
        );

        if (error) {
          log.warn("reset_email_failed", {
            email: maskEmail(normalizedEmail),
            code: error.code,
            message: error.message,
            rateLimited: isAuthRateLimitError(error.message, error.code),
          });
          toast.error(formatAuthErrorMessage(error.message, error.code));
          return;
        }

        log.info("reset_email_sent", { email: maskEmail(normalizedEmail) });
        setSent(true);
      } finally {
        submitLock.current = false;
      }
    });
  };

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
          {sent
            ? "Check your inbox for a reset link."
            : "Enter your email and we will send a password reset link."}
        </p>
      </div>

      <div className="px-6 pb-8 md:px-8">
        {sent ? (
          <div className="flex flex-col gap-4 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#dbe1ff] text-[#004ac6]">
              <Mail className="size-6" aria-hidden />
            </div>
            <p className="text-sm text-[#434655]">
              If an account exists for{" "}
              <span className="font-medium text-[#191b23]">{email}</span>, you
              will receive an email shortly. The link expires after a short
              time.
            </p>
            <Link
              href={loginHref(inviteCode, redirect)}
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#004ac6] hover:underline"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Back to sign in
            </Link>
          </div>
        ) : (
          <form
            className="flex flex-col gap-4"
            noValidate
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col gap-1">
              <label
                htmlFor="reset-email"
                className="text-sm font-medium text-[#191b23]"
              >
                Email address
              </label>
              <input
                id="reset-email"
                type="text"
                inputMode="email"
                className={inputClass}
                placeholder="janedoe@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmail((value) => normalizeEmail(value))}
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:bg-[#004ac6] hover:opacity-95 disabled:opacity-60"
            >
              {isPending ? "Sending…" : "Send reset link"}
            </button>

            <Link
              href={loginHref(inviteCode, redirect)}
              className="inline-flex items-center justify-center gap-2 text-sm font-medium text-[#434655] hover:text-[#191b23]"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
