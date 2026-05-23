"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { routes } from "@/lib/constants/routes";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(routes.login);
}
