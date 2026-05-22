import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
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
import type { UserRole } from "@/types/database";

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
    const { data } = await supabase
      .from("profiles")
      .select("role, skills_completed")
      .eq("id", user.id)
      .maybeSingle();
    profile = data as ProfileGate | null;
  }

  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    return NextResponse.redirect(url);
  };

  // Unauthenticated users cannot access protected areas
  if (!user && requiresAuth(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = routes.login;
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated but missing profile — send to login
  if (user && requiresAuth(pathname) && !profile) {
    return redirectTo(routes.login);
  }

  if (user && profile) {
    const home = roleHomePath(profile.role, profile.skills_completed);

    // Signed-in users should not see login/register
    if (isAuthPath(pathname)) {
      return redirectTo(home);
    }

    // RBAC: block cross-role areas
    if (!canAccessPath(profile.role, pathname, profile.skills_completed)) {
      return redirectTo(redirectForForbiddenPath(profile.role, profile.skills_completed));
    }

    // Students must finish onboarding before student portal
    if (
      profile.role === "student" &&
      !profile.skills_completed &&
      isStudentPath(pathname)
    ) {
      const url = request.nextUrl.clone();
      url.pathname = routes.onboarding;
      if (request.nextUrl.searchParams.has("code")) {
        url.searchParams.set(
          "code",
          request.nextUrl.searchParams.get("code")!
        );
      }
      return NextResponse.redirect(url);
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
