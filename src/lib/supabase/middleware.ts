import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  extractInviteCodeFromRequestUrl,
  buildLoginRedirectUrl,
} from "@/lib/auth/login-redirect";
import {
  canAccessPath,
  isAuthPath,
  isOnboardingPath,
  isStudentPath,
  redirectForForbiddenPath,
  requiresAuth,
  roleHomePath,
} from "@/lib/auth/rbac";
import { routes } from "@/lib/constants/routes";
import { createLogger, maskUserId } from "@/lib/logger";
import type { UserRole } from "@/types/database";

const log = createLogger("middleware");

type ProfileGate = {
  role: UserRole;
  skills_completed: boolean;
};

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  let profile: ProfileGate | null = null;
  if (user) {
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("role, skills_completed")
      .eq("id", user.id)
      .maybeSingle();
    profile = data as ProfileGate | null;

    if (profileError) {
      log.warn("profile_load_failed", {
        path: pathname,
        userId: maskUserId(user.id),
        message: profileError.message,
      });
    }
  }

  log.debug("request", {
    path: pathname,
    authenticated: Boolean(user),
    role: profile?.role,
  });

  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    return NextResponse.redirect(url);
  };

  const redirectToLogin = () => {
    const url = buildLoginRedirectUrl(request.nextUrl);
    log.debug("redirect_to_login", {
      from: pathname,
      hasCode: url.searchParams.has("code"),
      redirect: url.searchParams.get("redirect"),
    });
    return NextResponse.redirect(url);
  };

  const redirectToOnboarding = () => {
    const url = request.nextUrl.clone();
    url.pathname = routes.onboarding;
    url.search = "";
    const code = extractInviteCodeFromRequestUrl(request.nextUrl);
    if (code) url.searchParams.set("code", code);
    const returnPath = request.nextUrl.searchParams.get("redirect");
    if (
      returnPath?.startsWith("/") &&
      !returnPath.startsWith("//")
    ) {
      url.searchParams.set("redirect", returnPath);
    }
    return NextResponse.redirect(url);
  };

  // Unauthenticated users cannot access protected areas
  if (!user && requiresAuth(pathname)) {
    log.debug("redirect_unauthenticated", { path: pathname });
    return redirectToLogin();
  }

  // Authenticated but missing profile — send to login
  if (user && requiresAuth(pathname) && !profile) {
    log.warn("redirect_missing_profile", {
      path: pathname,
      userId: maskUserId(user.id),
    });
    return redirectToLogin();
  }

  if (user && profile) {
    const home = roleHomePath(profile.role, profile.skills_completed);

    // Signed-in users should not see login/register
    if (isAuthPath(pathname)) {
      log.debug("redirect_authenticated_from_auth", { home });
      return redirectTo(home);
    }

    // RBAC: block cross-role areas
    if (!canAccessPath(profile.role, pathname, profile.skills_completed)) {
      log.info("redirect_forbidden", {
        path: pathname,
        role: profile.role,
        skillsCompleted: profile.skills_completed,
      });
      return redirectTo(redirectForForbiddenPath(profile.role, profile.skills_completed));
    }

    // Students must finish onboarding before student portal
    if (
      profile.role === "student" &&
      !profile.skills_completed &&
      isStudentPath(pathname)
    ) {
      return redirectToOnboarding();
    }

    // Students who completed skills should not revisit onboarding
    if (
      profile.role === "student" &&
      profile.skills_completed &&
      isOnboardingPath(pathname)
    ) {
      return redirectTo(routes.student.dashboard);
    }
  }

  return supabaseResponse;
}
