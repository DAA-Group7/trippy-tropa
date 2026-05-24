import { NextResponse } from "next/server";
import { safeAuthNextPath } from "@/lib/auth/redirect";
import { createLogger } from "@/lib/logger";
import { getAppBaseUrl } from "@/lib/invite";
import { routes } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";

const log = createLogger("auth:callback");

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeAuthNextPath(
    requestUrl.searchParams.get("next"),
    routes.resetPassword
  );
  const origin = getAppBaseUrl();

  if (!code) {
    log.warn("callback_missing_code", { next });
    const loginUrl = new URL(routes.login, origin);
    loginUrl.searchParams.set("error", "auth_callback");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    log.warn("callback_exchange_failed", {
      message: error.message,
      code: error.code,
    });
    const loginUrl = new URL(routes.login, origin);
    loginUrl.searchParams.set("error", "auth_callback");
    return NextResponse.redirect(loginUrl);
  }

  log.info("callback_session_established", { next });
  return NextResponse.redirect(`${origin}${next}`);
}
