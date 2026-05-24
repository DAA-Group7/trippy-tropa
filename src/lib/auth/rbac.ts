import type { UserRole } from "@/types/database";
import { routes } from "@/lib/constants/routes";

/** Routes anyone can visit without a session */
export function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname.startsWith("/login")) return true;
  if (pathname.startsWith("/register")) return true;
  if (pathname.startsWith("/forgot-password")) return true;
  if (pathname.startsWith("/reset-password")) return true;
  if (pathname.startsWith("/auth/callback")) return true;
  if (pathname.startsWith("/join")) return true;
  return false;
}

export function isAuthPath(pathname: string): boolean {
  return pathname.startsWith("/login") || pathname.startsWith("/register");
}

export function isOfficerPath(pathname: string): boolean {
  return pathname.startsWith("/officer");
}

export function isStudentPath(pathname: string): boolean {
  return pathname.startsWith("/student");
}

export function isOnboardingPath(pathname: string): boolean {
  return pathname.startsWith("/onboarding");
}

export function requiresAuth(pathname: string): boolean {
  return (
    isOfficerPath(pathname) ||
    isStudentPath(pathname) ||
    isOnboardingPath(pathname)
  );
}

export function roleHomePath(
  role: UserRole,
  skillsCompleted: boolean
): string {
  if (role === "officer") return routes.officer.dashboard;
  if (!skillsCompleted) return routes.onboarding;
  return routes.student.dashboard;
}

export function canAccessPath(
  role: UserRole,
  pathname: string,
  skillsCompleted: boolean
): boolean {
  if (isPublicPath(pathname)) return true;

  if (isOfficerPath(pathname)) return role === "officer";
  if (isStudentPath(pathname)) return role === "student";
  if (isOnboardingPath(pathname)) {
    return role === "student" && !skillsCompleted;
  }

  return true;
}

export function redirectForForbiddenPath(
  role: UserRole,
  skillsCompleted: boolean
): string {
  return roleHomePath(role, skillsCompleted);
}
