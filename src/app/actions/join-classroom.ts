"use server";

import { revalidatePath } from "next/cache";
import { notifyStudentJoinedClassroom } from "@/app/actions/notifications";
import { recordClassroomActivity } from "@/lib/activity/record";
import { createClient } from "@/lib/supabase/server";
import { routes } from "@/lib/constants/routes";
import { createLogger, maskUserId } from "@/lib/logger";
import type { SkillRatings } from "@/types/database";

const log = createLogger("join");

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

  if (error || !data) {
    log.debug("classroom_lookup_miss", {
      code,
      error: error?.message,
    });
    return null;
  }

  log.debug("classroom_lookup_hit", {
    code,
    classroomId: data.id,
  });

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
    log.warn("enroll_unauthenticated", { inviteCode });
    return { ok: false, error: "You must be signed in to join a classroom." };
  }

  log.info("enroll_attempt", {
    inviteCode,
    userId: maskUserId(user.id),
  });

  const classroom = await getClassroomByInviteCode(inviteCode);
  if (!classroom) {
    log.warn("enroll_classroom_not_found", { inviteCode });
    return { ok: false, error: "Classroom not found. Check the invite link." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, skills_completed, full_name, email")
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
    log.info("enroll_already_member", {
      classroomId: classroom.id,
      userId: maskUserId(user.id),
    });
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
    log.error("enroll_insert_failed", {
      classroomId: classroom.id,
      userId: maskUserId(user.id),
      message: insertError.message,
    });
    return { ok: false, error: insertError.message };
  }

  await notifyStudentJoinedClassroom(
    user.id,
    classroom.id,
    classroom.name
  );

  const studentName =
    profile.full_name?.trim() ||
    profile.email?.split("@")[0] ||
    "A student";

  await recordClassroomActivity(supabase, {
    classroomId: classroom.id,
    actorId: user.id,
    eventType: "enrolled",
    payload: { studentName, studentId: user.id },
  });

  revalidatePath(routes.student.dashboard);
  revalidatePath(routes.officer.dashboard);

  log.info("enroll_success", {
    classroomId: classroom.id,
    userId: maskUserId(user.id),
  });

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
    log.warn("skills_unauthenticated");
    return { ok: false, error: "You must be signed in." };
  }

  log.info("skills_submit", {
    userId: maskUserId(user.id),
    hasInviteCode: Boolean(inviteCode),
  });

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
    log.error("skills_ratings_failed", {
      userId: maskUserId(user.id),
      message: ratingsError.message,
    });
    return { ok: false, error: ratingsError.message };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ skills_completed: true })
    .eq("id", user.id);

  if (profileError) {
    log.error("skills_profile_update_failed", {
      userId: maskUserId(user.id),
      message: profileError.message,
    });
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
    log.warn("process_join_invalid_input");
    return { ok: false, error: "Enter a valid classroom code or invite link." };
  }

  const classroom = await getClassroomByInviteCode(code);
  const { user, profile } = await getSessionUser();

  const decision = decideInviteLanding(code, user, profile, !!classroom);

  log.info("process_join_decision", {
    code,
    decision: decision.type,
    authenticated: Boolean(user),
    classroomFound: Boolean(classroom),
  });

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
