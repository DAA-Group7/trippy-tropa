"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { routes } from "@/lib/constants/routes";
import type { SkillRatings } from "@/types/database";

export type ClassroomPreview = {
  id: string;
  name: string;
  subject: string | null;
  inviteCode: string;
};

export type EnrollResult =
  | {
      ok: true;
      classroomId: string;
      classroomName: string;
      alreadyMember: boolean;
    }
  | { ok: false; error: string };

export async function getClassroomByInviteCode(
  code: string
): Promise<ClassroomPreview | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("classrooms")
    .select("id, name, subject, invite_code")
    .eq("invite_code", code)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    subject: data.subject,
    inviteCode: data.invite_code,
  };
}

export async function enrollInClassroom(
  inviteCode: string
): Promise<EnrollResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in to join a classroom." };
  }

  const classroom = await getClassroomByInviteCode(inviteCode);
  if (!classroom) {
    return { ok: false, error: "Classroom not found. Check the invite link." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, skills_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "student") {
    return {
      ok: false,
      error: "Only student accounts can join via invite link.",
    };
  }

  if (!profile.skills_completed) {
    return {
      ok: false,
      error: "Complete skill assessment before joining a classroom.",
    };
  }

  const { data: existing } = await supabase
    .from("classroom_members")
    .select("classroom_id")
    .eq("user_id", user.id)
    .eq("classroom_id", classroom.id)
    .maybeSingle();

  if (existing) {
    return {
      ok: true,
      classroomId: classroom.id,
      classroomName: classroom.name,
      alreadyMember: true,
    };
  }

  const { error: insertError } = await supabase
    .from("classroom_members")
    .insert({
      classroom_id: classroom.id,
      user_id: user.id,
    });

  if (insertError) {
    return { ok: false, error: insertError.message };
  }

  revalidatePath(routes.student.dashboard);

  return {
    ok: true,
    classroomId: classroom.id,
    classroomName: classroom.name,
    alreadyMember: false,
  };
}

export async function completeSkillAssessment(
  ratings: SkillRatings,
  inviteCode?: string
): Promise<{ ok: true; redirectTo: string } | { ok: false; error: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const { error: ratingsError } = await supabase.from("skill_ratings").upsert(
    {
      user_id: user.id,
      communication: ratings.communication,
      leadership: ratings.leadership,
      technical: ratings.technical,
      teamwork: ratings.teamwork,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (ratingsError) {
    return { ok: false, error: ratingsError.message };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ skills_completed: true })
    .eq("id", user.id);

  if (profileError) {
    return { ok: false, error: profileError.message };
  }

  if (inviteCode) {
    const enroll = await enrollInClassroom(inviteCode);
    if (!enroll.ok) {
      return { ok: false, error: enroll.error };
    }

    const joined = enroll.alreadyMember ? "already" : "new";
    return {
      ok: true,
      redirectTo: `${routes.student.dashboard}?joined=${joined}&classroom=${encodeURIComponent(enroll.classroomName)}`,
    };
  }

  return { ok: true, redirectTo: routes.student.dashboard };
}

/** Used by manual join form — returns next URL for client navigation */
export async function processJoinInvite(
  rawInput: string
): Promise<
  | { ok: true; redirectTo: string }
  | { ok: false; error: string }
> {
  const { parseInviteCodeFromInput } = await import("@/lib/invite");
  const {
    loginWithInvite,
    onboardingWithCode,
    decideInviteLanding,
  } = await import("@/lib/auth/join-flow");
  const { getSessionUser } = await import("@/lib/auth/session");

  const code = parseInviteCodeFromInput(rawInput);
  if (!code) {
    return { ok: false, error: "Enter a valid classroom code or invite link." };
  }

  const classroom = await getClassroomByInviteCode(code);
  const { user, profile } = await getSessionUser();

  const decision = decideInviteLanding(code, user, profile, !!classroom);

  switch (decision.type) {
    case "not_found":
      return { ok: false, error: "Classroom not found. Check the link." };
    case "auth_required":
      return {
        ok: true,
        redirectTo: loginWithInvite(code),
      };
    case "forbidden":
      return {
        ok: false,
        error:
          decision.reason === "officer"
            ? "Officer accounts cannot join as students."
            : "This account cannot join classrooms.",
      };
    case "onboarding":
      return { ok: true, redirectTo: onboardingWithCode(code) };
    case "ready_to_enroll": {
      const result = await enrollInClassroom(code);
      if (!result.ok) return { ok: false, error: result.error };
      const joined = result.alreadyMember ? "already" : "new";
      return {
        ok: true,
        redirectTo: `${routes.student.dashboard}?joined=${joined}&classroom=${encodeURIComponent(result.classroomName)}`,
      };
    }
  }
}
