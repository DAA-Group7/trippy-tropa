import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types/database";

export type SessionProfile = Pick<
  Profile,
  "id" | "email" | "full_name" | "role" | "skills_completed"
>;

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, skills_completed")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user,
    profile: profile as SessionProfile | null,
  };
}

export async function getProfileForUserId(
  userId: string
): Promise<SessionProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, skills_completed")
    .eq("id", userId)
    .maybeSingle();

  return data as SessionProfile | null;
}

export function assertRole(
  profile: SessionProfile | null,
  allowed: UserRole[]
): profile is SessionProfile {
  return profile !== null && allowed.includes(profile.role);
}
