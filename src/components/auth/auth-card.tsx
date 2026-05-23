"use client";

import { useRef, useState, useTransition } from "react";
import { signUpStudent } from "@/app/actions/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  GraduationCap,
  Link2,
  LogIn,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { normalizeEmail, parseEmail } from "@/lib/auth/email";
import {
  formatAuthErrorMessage,
  isAuthRateLimitError,
} from "@/lib/auth/errors";
import { resolvePostAuthRedirect } from "@/lib/auth/join-flow";
import { createLogger, maskEmail } from "@/lib/logger";
import { buildJoinUrl } from "@/lib/invite";
import { APP_NAME } from "@/lib/constants/brand";
import { routes } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/database";

const inputClass =
  "w-full rounded-lg border border-[#c3c6d7] bg-white px-4 py-2.5 text-base text-[#191b23] transition-colors placeholder:text-[#737686] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]";

const cardShadow =
  "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]";

const log = createLogger("auth:client");

export type AuthMode = "login" | "register";

interface AuthCardProps {
  mode: AuthMode;
  inviteCode?: string;
  redirect?: string;
}

function authHref(mode: AuthMode, inviteCode?: string, redirect?: string) {
  const base = mode === "login" ? routes.login : routes.register;
  const params = new URLSearchParams();
  if (inviteCode) params.set("code", inviteCode);
  if (redirect) params.set("redirect", redirect);
  const q = params.toString();
  return q ? `${base}?${q}` : base;
}

export function AuthCard({ mode, inviteCode, redirect }: AuthCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const submitLock = useRef(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const joinUrl = inviteCode ? buildJoinUrl(inviteCode) : null;
  const isLogin = mode === "login";

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

    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    if (!isLogin && password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (!isLogin && !fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    const normalizedEmail = parsedEmail.email;
    const fallbackRedirect = inviteCode
      ? routes.joinByCode(inviteCode)
      : undefined;

    startTransition(async () => {
      submitLock.current = true;
      try {
      const supabase = createClient();
      const requested = redirect ?? fallbackRedirect;

      log.info(isLogin ? "sign_in_attempt" : "sign_up_attempt", {
        email: maskEmail(normalizedEmail),
        mode: isLogin ? "login" : "register",
        hasInviteCode: Boolean(inviteCode),
      });

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) {
          log.warn("sign_in_failed", {
            email: maskEmail(normalizedEmail),
            code: error.code,
            message: error.message,
            rateLimited: isAuthRateLimitError(error.message),
          });
          toast.error(formatAuthErrorMessage(error.message, error.code));
          return;
        }

        log.info("sign_in_success", {
          userId: data.user.id.slice(0, 8) + "…",
        });

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, skills_completed")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profileError || !profile) {
          log.error("profile_missing_after_sign_in", {
            userId: data.user.id.slice(0, 8) + "…",
            profileError: profileError?.message,
          });
          toast.error(
            "Profile not found. Run migrations 003–004 and seed users in Supabase."
          );
          return;
        }

        const destination = resolvePostAuthRedirect(
          profile.role as UserRole,
          profile.skills_completed,
          requested,
          inviteCode
        );

        log.debug("sign_in_redirect", { destination, role: profile.role });
        toast.success("Signed in");
        router.push(destination);
        router.refresh();
        return;
      }

      const result = await signUpStudent(
        normalizedEmail,
        password,
        fullName.trim(),
        { redirect: requested, inviteCode }
      );

      if (!result.ok) {
        log.warn("sign_up_failed", {
          email: maskEmail(normalizedEmail),
          error: result.error,
          rateLimited: isAuthRateLimitError(result.error),
        });
        toast.error(result.error);
        return;
      }

      log.info("sign_up_success", {
        email: maskEmail(normalizedEmail),
        redirectTo: result.redirectTo,
      });

      toast.success("Account created");
      router.push(result.redirectTo);
      router.refresh();
      } finally {
        submitLock.current = false;
      }
    });
  };

  const handleSso = () => {
    toast.info("University SSO will be available when auth is wired");
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
          {isLogin
            ? "Sign in to your academic workspace."
            : "Create your student account to join group work."}
        </p>
      </div>

      {inviteCode && joinUrl && (
        <div className="mx-6 mb-4 rounded-lg border border-[#004ac6]/20 bg-[#dbe1ff]/50 p-3 md:mx-8">
          <div className="flex items-start gap-2">
            <Link2 className="mt-0.5 size-4 shrink-0 text-[#004ac6]" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#004ac6]">
                Joining via classroom invite
              </p>
              <p className="truncate text-xs text-[#505f76]">{joinUrl}</p>
              <p className="mt-1 text-xs text-[#434655]">
                Sign in or register to continue to the join page.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 pb-6 md:px-8">
        <div className="flex rounded-lg border border-[#c3c6d7] bg-[#f3f3fe] p-1">
          <Link
            href={authHref("login", inviteCode, redirect)}
            className={cn(
              "flex-1 rounded-md py-2.5 text-center text-sm font-medium transition-colors",
              isLogin
                ? "border border-[#c3c6d7] bg-white text-[#191b23] shadow-sm"
                : "text-[#434655] hover:text-[#191b23]"
            )}
          >
            Login
          </Link>
          <Link
            href={authHref("register", inviteCode, redirect)}
            className={cn(
              "flex-1 rounded-md py-2.5 text-center text-sm font-medium transition-colors",
              !isLogin
                ? "border border-[#c3c6d7] bg-white text-[#191b23] shadow-sm"
                : "text-[#434655] hover:text-[#191b23]"
            )}
          >
            Register
          </Link>
        </div>
      </div>

      <div className="px-6 pb-8 md:px-8">
        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={handleSubmit}
        >
          {!isLogin && (
            <div className="flex flex-col gap-1">
              <label
                htmlFor="fullName"
                className="text-sm font-medium text-[#191b23]"
              >
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                className={inputClass}
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-[#191b23]">
              Email address
            </label>
            <input
              id="email"
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

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium text-[#191b23]"
              >
                Password
              </label>
              {isLogin && (
                <button
                  type="button"
                  className="text-xs font-semibold text-[#004ac6] hover:underline"
                  onClick={() =>
                    toast.info("Password reset will be available when wired")
                  }
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className={cn(inputClass, "pr-11")}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isLogin ? "current-password" : "new-password"}
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

          <button
            type="submit"
            disabled={isPending}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:bg-[#004ac6] hover:opacity-95 disabled:opacity-60"
          >
            {isPending ? (
              "Please wait…"
            ) : isLogin ? (
              <>
                Sign In
                <LogIn className="size-[18px]" />
              </>
            ) : (
              <>
                Create Account
                <UserPlus className="size-[18px]" />
              </>
            )}
          </button>
        </form>

        <div className="relative flex items-center py-6">
          <div className="flex-grow border-t border-[#c3c6d7]" />
          <span className="mx-4 shrink-0 text-xs font-semibold uppercase tracking-wide text-[#434655]">
            Single Sign-On
          </span>
          <div className="flex-grow border-t border-[#c3c6d7]" />
        </div>

        <button
          type="button"
          onClick={handleSso}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#c3c6d7] bg-white px-4 py-2.5 text-sm font-medium text-[#505f76] transition-colors hover:bg-[#f3f3fe]"
        >
          <GraduationCap className="size-[18px] text-[#004ac6]" />
          Continue with University Portal
        </button>
      </div>

      <div className="border-t border-[#c3c6d7] bg-[#f3f3fe] p-4 text-center">
        <p className="text-sm text-[#434655]">
          By signing in, you agree to the{" "}
          <button
            type="button"
            className="text-[#004ac6] hover:underline"
            onClick={() => toast.info("Terms of Service — coming soon")}
          >
            Terms of Service
          </button>{" "}
          and{" "}
          <button
            type="button"
            className="text-[#004ac6] hover:underline"
            onClick={() => toast.info("Privacy Policy — coming soon")}
          >
            Privacy Policy
          </button>
          .
        </p>
      </div>
    </div>
  );
}
