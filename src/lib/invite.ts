import { routes } from "@/lib/constants/routes";

/** Short invite slug, e.g. `9x2a-b4zq` */
export function generateInviteCode(): string {
  const segment = () =>
    Math.random().toString(36).slice(2, 6).replace(/[^a-z0-9]/g, "a");
  return `${segment()}-${segment()}`;
}

export function getAppBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/** Full URL students open to join, e.g. `/join/c/9x2a-b4zq` */
export function buildJoinUrl(inviteCode: string, baseUrl?: string): string {
  const base = baseUrl ?? getAppBaseUrl();
  return `${base}${routes.joinByCode(inviteCode)}`;
}

export function parseInviteCodeFromInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/\/join\/c\/([^/?#]+)/i);
    if (match) return match[1];
    const codeParam = url.searchParams.get("code");
    if (codeParam) return codeParam;
  } catch {
    // Not a URL — treat as raw code
  }

  if (/^[\w-]{4,32}$/i.test(trimmed)) return trimmed;
  return null;
}
