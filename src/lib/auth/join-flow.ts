import { routes } from "@/lib/constants/routes";
import { parseInviteCodeFromInput } from "@/lib/invite";
import type { UserRole } from "@/types/database";
import type { SessionProfile } from "@/lib/auth/session";

/** Extract invite code from a join URL path */
export function parseInviteCodeFromPath(path: string): string | null {
  const match = path.match(/\/join\/c\/([^/?#]+)/i);
  return match?.[1] ?? null;
}

export function onboardingWithCode(code: string): string {
  return `${routes.onboarding}?code=${encodeURIComponent(code)}`;
}

export function loginWithInvite(code: string, redirect?: string): string {
  const params = new URLSearchParams();
  params.set("code", code);
  params.set("redirect", redirect ?? routes.joinByCode(code));
  return `${routes.login}?${params.toString()}`;
}

export function registerWithInvite(code: string, redirect?: string): string {
  const params = new URLSearchParams();
  params.set("code", code);
  params.set("redirect", redirect ?? routes.joinByCode(code));
  return `${routes.register}?${params.toString()}`;
}

/**
 * After login/register — resume invite flow:
 * new students → onboarding; returning students → join link (auto-enroll).
 */
export function resolvePostAuthRedirect(
  role: UserRole,
  skillsCompleted: boolean,
  requested?: string,
  inviteCode?: string
): string {
  const code =
    inviteCode ??
    (requested ? parseInviteCodeFromPath(requested) : null) ??
    (requested ? parseInviteCodeFromInput(requested) : null);

  if (code && role === "student") {
    if (!skillsCompleted) {
      return onboardingWithCode(code);
    }
    return routes.joinByCode(code);
  }

  if (
    requested &&
    requested.startsWith("/") &&
    !requested.startsWith("//") &&
    canAccessPathForRedirect(role, requested, skillsCompleted)
  ) {
    return requested;
  }

  return roleHomePath(role, skillsCompleted);
}

function roleHomePath(role: UserRole, skillsCompleted: boolean): string {
  if (role === "officer") return routes.officer.dashboard;
  if (!skillsCompleted) return routes.onboarding;
  return routes.student.dashboard;
}

function canAccessPathForRedirect(
  role: UserRole,
  pathname: string,
  skillsCompleted: boolean
): boolean {
  if (pathname.startsWith("/officer")) return role === "officer";
  if (pathname.startsWith("/student")) return role === "student";
  if (pathname.startsWith("/onboarding")) {
    return role === "student" && !skillsCompleted;
  }
  if (pathname.startsWith("/join")) return true;
  return false;
}

export type InviteLandingDecision =
  | { type: "not_found" }
  | { type: "auth_required"; code: string }
  | { type: "forbidden"; reason: "officer" | "unknown_role" }
  | { type: "onboarding"; code: string }
  | { type: "ready_to_enroll"; code: string };

export function decideInviteLanding(
  code: string,
  user: { id: string } | null,
  profile: SessionProfile | null,
  classroomExists: boolean
): InviteLandingDecision {
  if (!classroomExists) return { type: "not_found" };

  if (!user) return { type: "auth_required", code };

  if (!profile || profile.role !== "student") {
    return {
      type: "forbidden",
      reason: profile?.role === "officer" ? "officer" : "unknown_role",
    };
  }

  if (!profile.skills_completed) {
    return { type: "onboarding", code };
  }

  return { type: "ready_to_enroll", code };
}
