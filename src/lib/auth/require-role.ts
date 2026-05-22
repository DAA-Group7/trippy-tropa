import { redirect } from "next/navigation";
import { roleHomePath } from "@/lib/auth/rbac";
import { getSessionUser } from "@/lib/auth/session";
import { routes } from "@/lib/constants/routes";
import type { UserRole } from "@/types/database";

export async function requireAuth(redirectTo?: string) {
  const { user, profile } = await getSessionUser();

  if (!user) {
    redirect(
      redirectTo
        ? `${routes.login}?redirect=${encodeURIComponent(redirectTo)}`
        : routes.login
    );
  }

  if (!profile) {
    redirect(routes.login);
  }

  return { user, profile };
}

export async function requireRole(allowed: UserRole[], redirectTo?: string) {
  const { user, profile } = await requireAuth(redirectTo);

  if (!allowed.includes(profile.role)) {
    redirect(roleHomePath(profile.role, profile.skills_completed));
  }

  return { user, profile };
}
