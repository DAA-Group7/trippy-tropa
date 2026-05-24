import { parseInviteCodeFromPath } from "@/lib/auth/join-flow";
import { isAuthPath } from "@/lib/auth/rbac";
import { routes } from "@/lib/constants/routes";

export function extractInviteCodeFromRequestUrl(url: URL): string | null {
  const code = url.searchParams.get("code");
  if (code) return code;
  return parseInviteCodeFromPath(url.pathname);
}

/** Path to resume after login/register (relative, same-origin only). */
export function buildPostAuthReturnPath(url: URL): string {
  const redirect = url.searchParams.get("redirect");
  if (redirect?.startsWith("/") && !redirect.startsWith("//")) {
    return redirect;
  }

  if (!isAuthPath(url.pathname)) {
    const path = url.pathname + url.search;
    if (path && path !== "/") return path;
  }

  const code = extractInviteCodeFromRequestUrl(url);
  if (code) return routes.joinByCode(code);

  return routes.home;
}

/** Login URL preserving invite `code` and post-auth `redirect`. */
export function buildLoginRedirectUrl(requestUrl: URL): URL {
  const loginUrl = new URL(requestUrl);
  loginUrl.pathname = routes.login;

  const code = extractInviteCodeFromRequestUrl(requestUrl);
  const returnPath = buildPostAuthReturnPath(requestUrl);

  loginUrl.search = "";
  if (code) loginUrl.searchParams.set("code", code);
  loginUrl.searchParams.set("redirect", returnPath);

  return loginUrl;
}
