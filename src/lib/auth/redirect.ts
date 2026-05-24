import { routes } from "@/lib/constants/routes";

/** Relative path only — blocks open redirects in auth callbacks. */
export function safeAuthNextPath(next: string | null, fallback: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }
  return next;
}

export function authCallbackUrl(nextPath: string): string {
  const params = new URLSearchParams({ next: nextPath });
  return `${routes.authCallback}?${params.toString()}`;
}
