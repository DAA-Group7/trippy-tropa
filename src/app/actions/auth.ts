"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { routes } from "@/lib/constants/routes";
import { createLogger } from "@/lib/logger";

const log = createLogger("auth:server");

export async function signOut() {
  log.info("sign_out");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(routes.login);
}
