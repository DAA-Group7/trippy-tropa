"use server";

import { redirect } from "next/navigation";
import { parseEmail } from "@/lib/auth/email";
import { formatAuthErrorMessage, isAuthRateLimitError } from "@/lib/auth/errors";
import { resolvePostAuthRedirect } from "@/lib/auth/join-flow";
import { getProfileForUserId } from "@/lib/auth/session";
import { createLogger, maskEmail, maskUserId } from "@/lib/logger";
import { createAdminClient, hasAdminAuthBypass } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { routes } from "@/lib/constants/routes";
import type { UserRole } from "@/types/database";

const log = createLogger("auth:server");

export type SignUpStudentResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string };

async function signInAndResolveRedirect(
  email: string,
  password: string,
  redirect?: string,
  inviteCode?: string
): Promise<SignUpStudentResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    log.warn("sign_in_after_sign_up_failed", {
      email: maskEmail(email),
      code: error.code,
      message: error.message,
    });
    return {
      ok: false,
      error: formatAuthErrorMessage(error.message, error.code),
    };
  }

  const profile = await getProfileForUserId(data.user.id);
  const role = (profile?.role as UserRole) ?? "student";
  const skillsCompleted = profile?.skills_completed ?? false;

  const destination = resolvePostAuthRedirect(
    role,
    skillsCompleted,
    redirect,
    inviteCode
  );

  log.info("sign_up_session_ready", {
    userId: maskUserId(data.user.id),
    redirectTo: destination,
    usedAdminBypass: hasAdminAuthBypass(),
  });

  return { ok: true, redirectTo: destination };
}

function isAlreadyRegisteredError(message: string, code?: string | null): boolean {
  const lower = message.toLowerCase();
  return (
    code === "user_already_exists" ||
    lower.includes("already registered") ||
    lower.includes("already been registered") ||
    lower.includes("already exists")
  );
}

/**
 * Register a student without sending confirmation emails when
 * SUPABASE_SERVICE_ROLE_KEY is configured (recommended for local dev).
 */
export async function signUpStudent(
  rawEmail: string,
  password: string,
  fullName: string,
  options?: { redirect?: string; inviteCode?: string }
): Promise<SignUpStudentResult> {
  const parsed = parseEmail(rawEmail);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  if (!password || password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters" };
  }

  if (!fullName.trim()) {
    return { ok: false, error: "Please enter your full name" };
  }

  const email = parsed.email;
  const { redirect: requestedRedirect, inviteCode } = options ?? {};

  log.info("sign_up_attempt", {
    email: maskEmail(email),
    adminBypass: hasAdminAuthBypass(),
    hasInviteCode: Boolean(inviteCode),
  });

  const admin = createAdminClient();

  if (admin) {
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName.trim(),
          role: "student",
        },
      });

    if (createError) {
      if (isAlreadyRegisteredError(createError.message, createError.code)) {
        log.info("sign_up_admin_user_exists_try_sign_in", {
          email: maskEmail(email),
        });
        return signInAndResolveRedirect(
          email,
          password,
          requestedRedirect,
          inviteCode
        );
      }

      log.error("sign_up_admin_failed", {
        email: maskEmail(email),
        code: createError.code,
        message: createError.message,
      });

      return {
        ok: false,
        error: formatAuthErrorMessage(createError.message, createError.code),
      };
    }

    if (!created.user) {
      return { ok: false, error: "Could not create account." };
    }

    return signInAndResolveRedirect(
      email,
      password,
      requestedRedirect,
      inviteCode
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName.trim(),
        role: "student",
      },
    },
  });

  if (error) {
    log.warn("sign_up_failed", {
      email: maskEmail(email),
      code: error.code,
      message: error.message,
      rateLimited: isAuthRateLimitError(error.message, error.code),
    });

    if (isAlreadyRegisteredError(error.message, error.code)) {
      return signInAndResolveRedirect(
        email,
        password,
        requestedRedirect,
        inviteCode
      );
    }

    return {
      ok: false,
      error: formatAuthErrorMessage(error.message, error.code),
    };
  }

  if (!data.user) {
    return { ok: false, error: "Could not create account." };
  }

  if (data.session) {
    const profile = await getProfileForUserId(data.user.id);
    const role = (profile?.role as UserRole) ?? "student";
    const skillsCompleted = profile?.skills_completed ?? false;
    const destination = resolvePostAuthRedirect(
      role,
      skillsCompleted,
      requestedRedirect,
      inviteCode
    );

    log.info("sign_up_success", {
      userId: maskUserId(data.user.id),
      redirectTo: destination,
    });

    return { ok: true, redirectTo: destination };
  }

  log.info("sign_up_confirmation_required", {
    userId: maskUserId(data.user.id),
    email: maskEmail(email),
  });

  return {
    ok: false,
    error:
      "Check your email to confirm your account, then sign in. For local dev without email, add SUPABASE_SERVICE_ROLE_KEY to .env or disable “Confirm email” in Supabase Auth.",
  };
}

export async function signOut() {
  log.info("sign_out");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(routes.login);
}
