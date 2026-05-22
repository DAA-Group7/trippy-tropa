"use server";

import { createClient } from "@/lib/supabase/server";
import { roleHomePath } from "@/lib/auth/rbac";
import { getProfileForUserId } from "@/lib/auth/session";
import type { UserRole } from "@/types/database";

export type AuthActionResult =
  | {
      ok: true;
      redirectTo: string;
      role: UserRole;
    }
  | { ok: false; error: string };

export async function signInWithPassword(
  email: string,
  password: string,
  redirect?: string
): Promise<AuthActionResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const profile = await getProfileForUserId(data.user.id);
  if (!profile) {
    return { ok: false, error: "Profile not found. Contact support." };
  }

  const destination =
    redirect && redirect.startsWith("/") && !redirect.startsWith("//")
      ? redirect
      : roleHomePath(profile.role, profile.skills_completed);

  return { ok: true, redirectTo: destination, role: profile.role };
}

export async function signUpStudent(
  email: string,
  password: string,
  fullName: string,
  redirect?: string
): Promise<AuthActionResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        full_name: fullName.trim(),
        role: "student",
      },
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data.user) {
    return { ok: false, error: "Could not create account." };
  }

  const profile = await getProfileForUserId(data.user.id);
  const role = profile?.role ?? "student";
  const skillsCompleted = profile?.skills_completed ?? false;

  const destination =
    redirect && redirect.startsWith("/") && !redirect.startsWith("//")
      ? redirect
      : roleHomePath(role, skillsCompleted);

  return { ok: true, redirectTo: destination, role };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
