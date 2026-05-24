"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { enrollInClassroom } from "@/app/actions/join-classroom";
import {
  defaultTemplateInputs,
  normalizeMetricKey,
  toCoreSkillRatings,
  type ClassroomSkillTemplateRow,
} from "@/lib/skills/classroom-skills";
import {
  classroomUsesCustomTemplates,
  fetchClassroomSkillTemplates,
} from "@/lib/skills/resolve-classroom-student-skills";
import { createClient } from "@/lib/supabase/server";
import { routes } from "@/lib/constants/routes";
import type { SkillRatings } from "@/types/database";

const templateInputSchema = z.object({
  metricKey: z.string().min(1).max(48),
  label: z.string().min(1).max(80),
  description: z.string().max(300).optional(),
  tooltip: z.string().max(500).optional(),
  multiplier: z.coerce.number().min(0.25).max(10),
  sortOrder: z.coerce.number().int().min(0).max(99),
});

const saveTemplatesSchema = z.object({
  classroomId: z.string().uuid(),
  templates: z.array(templateInputSchema).min(1).max(12),
});

const classroomRatingsSchema = z.record(
  z.string().min(1),
  z.coerce.number().int().min(1).max(5)
);

async function getOfficerContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "officer") return null;
  return { supabase, userId: user.id };
}

async function assertOwnsClassroom(
  supabase: Awaited<ReturnType<typeof createClient>>,
  classroomId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("classrooms")
    .select("id")
    .eq("id", classroomId)
    .eq("created_by", userId)
    .maybeSingle();
  return !!data;
}

function revalidateClassroomPaths(classroomId: string) {
  revalidatePath(routes.officer.classroom(classroomId));
  revalidatePath(routes.officer.generateGroups(classroomId));
  revalidatePath(routes.officer.tasks(classroomId));
}

export async function getClassroomSkillTemplatesForOfficer(
  classroomId: string
): Promise<ClassroomSkillTemplateRow[] | null> {
  const ctx = await getOfficerContext();
  if (!ctx || !(await assertOwnsClassroom(ctx.supabase, classroomId, ctx.userId))) {
    return null;
  }
  return fetchClassroomSkillTemplates(ctx.supabase, classroomId);
}

/** Public read for enrolled students during onboarding (via invite). */
export async function getClassroomSkillTemplatesForOnboarding(
  classroomId: string
): Promise<ClassroomSkillTemplateRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: membership } = await supabase
    .from("classroom_members")
    .select("classroom_id")
    .eq("classroom_id", classroomId)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: classroom } = await supabase
    .from("classrooms")
    .select("id, invite_code")
    .eq("id", classroomId)
    .maybeSingle();

  if (!classroom) return [];

  if (!membership) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role !== "student") return [];
  }

  return fetchClassroomSkillTemplates(supabase, classroomId);
}

export async function getOnboardingSkillContext(inviteCode?: string): Promise<{
  classroomId: string | null;
  classroomName: string | null;
  subject: string | null;
  templates: ClassroomSkillTemplateRow[];
  usesClassroomTemplates: boolean;
}> {
  if (!inviteCode) {
    return {
      classroomId: null,
      classroomName: null,
      subject: null,
      templates: [],
      usesClassroomTemplates: false,
    };
  }

  const supabase = await createClient();
  const { data: classroom } = await supabase
    .from("classrooms")
    .select("id, name, subject, invite_code")
    .eq("invite_code", inviteCode)
    .maybeSingle();

  if (!classroom) {
    return {
      classroomId: null,
      classroomName: null,
      subject: null,
      templates: [],
      usesClassroomTemplates: false,
    };
  }

  const templates = await fetchClassroomSkillTemplates(supabase, classroom.id);

  return {
    classroomId: classroom.id,
    classroomName: classroom.name,
    subject: classroom.subject,
    templates,
    usesClassroomTemplates: templates.length > 0,
  };
}

export async function seedDefaultClassroomSkillTemplates(
  supabase: Awaited<ReturnType<typeof createClient>>,
  classroomId: string
): Promise<void> {
  const existing = await fetchClassroomSkillTemplates(supabase, classroomId);
  if (existing.length > 0) return;

  const rows = defaultTemplateInputs().map((t) => ({
    classroom_id: classroomId,
    metric_key: t.metricKey,
    label: t.label,
    description: t.description ?? null,
    tooltip: t.tooltip ?? null,
    multiplier: t.multiplier,
    sort_order: t.sortOrder,
  }));

  await supabase.from("classroom_skill_templates").insert(rows);
}

export async function saveClassroomSkillTemplates(
  input: z.infer<typeof saveTemplatesSchema>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = saveTemplatesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid template data",
    };
  }

  const ctx = await getOfficerContext();
  if (
    !ctx ||
    !(await assertOwnsClassroom(
      ctx.supabase,
      parsed.data.classroomId,
      ctx.userId
    ))
  ) {
    return { ok: false, error: "Access denied." };
  }

  const keys = new Set<string>();
  for (const template of parsed.data.templates) {
    const key = normalizeMetricKey(template.metricKey);
    if (!key) return { ok: false, error: "Each skill needs a valid key." };
    if (keys.has(key)) return { ok: false, error: "Duplicate skill keys." };
    keys.add(key);
  }

  const { error: deleteError } = await ctx.supabase
    .from("classroom_skill_templates")
    .delete()
    .eq("classroom_id", parsed.data.classroomId);

  if (deleteError) return { ok: false, error: deleteError.message };

  const rows = parsed.data.templates.map((t, index) => ({
    classroom_id: parsed.data.classroomId,
    metric_key: normalizeMetricKey(t.metricKey),
    label: t.label.trim(),
    description: t.description?.trim() || null,
    tooltip: t.tooltip?.trim() || null,
    multiplier: t.multiplier,
    sort_order: t.sortOrder ?? index,
  }));

  const { error: insertError } = await ctx.supabase
    .from("classroom_skill_templates")
    .insert(rows);

  if (insertError) return { ok: false, error: insertError.message };

  revalidateClassroomPaths(parsed.data.classroomId);
  return { ok: true };
}

export async function resetClassroomSkillTemplatesToDefault(
  classroomId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const inputs = defaultTemplateInputs();
  return saveClassroomSkillTemplates({ classroomId, templates: inputs });
}

async function syncLegacySkillRatings(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  skills: SkillRatings
): Promise<void> {
  await supabase.from("skill_ratings").upsert(
    {
      user_id: userId,
      communication: skills.communication,
      leadership: skills.leadership,
      technical: skills.technical,
      teamwork: skills.teamwork,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}

export async function completeClassroomSkillAssessment(
  classroomId: string,
  ratingsByMetricKey: Record<string, number>,
  inviteCode?: string
): Promise<{ ok: true; redirectTo: string } | { ok: false; error: string }> {
  const parsed = classroomRatingsSchema.safeParse(ratingsByMetricKey);
  if (!parsed.success) {
    return { ok: false, error: "Invalid ratings." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const templates = await fetchClassroomSkillTemplates(supabase, classroomId);
  if (templates.length === 0) {
    return {
      ok: false,
      error: "This classroom has no skill metrics configured.",
    };
  }

  for (const template of templates) {
    if (parsed.data[template.metricKey] == null) {
      return {
        ok: false,
        error: `Rate all skills, including ${template.label}.`,
      };
    }
  }

  let enrollResult: Awaited<ReturnType<typeof enrollInClassroom>> | null = null;
  if (inviteCode) {
    enrollResult = await enrollInClassroom(inviteCode);
    if (!enrollResult.ok) return { ok: false, error: enrollResult.error };
  } else {
    const { data: member } = await supabase
      .from("classroom_members")
      .select("classroom_id")
      .eq("classroom_id", classroomId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!member) {
      return {
        ok: false,
        error: "Join this classroom before submitting your assessment.",
      };
    }
  }

  const now = new Date().toISOString();
  const rows = templates.map((template) => ({
    classroom_id: classroomId,
    user_id: user.id,
    template_id: template.id,
    rating: parsed.data[template.metricKey]!,
    updated_at: now,
  }));

  const { error: ratingsError } = await supabase
    .from("student_classroom_skill_ratings")
    .upsert(rows, { onConflict: "classroom_id,user_id,template_id" });

  if (ratingsError) return { ok: false, error: ratingsError.message };

  const coreSkills = toCoreSkillRatings(templates, parsed.data);
  await syncLegacySkillRatings(supabase, user.id, coreSkills);

  await supabase
    .from("profiles")
    .update({ skills_completed: true })
    .eq("id", user.id);

  await supabase
    .from("classroom_members")
    .update({ skills_assessed_at: now })
    .eq("classroom_id", classroomId)
    .eq("user_id", user.id);

  revalidatePath(routes.onboarding);
  revalidatePath(routes.student.dashboard);
  revalidatePath(routes.officer.classroom(classroomId));

  if (enrollResult?.ok) {
    const joined = enrollResult.alreadyMember ? "already" : "new";
    return {
      ok: true,
      redirectTo: `${routes.student.dashboard}?joined=${joined}&classroom=${encodeURIComponent(enrollResult.classroomName)}`,
    };
  }

  return { ok: true, redirectTo: routes.student.dashboard };
}

export async function memberNeedsClassroomAssessment(
  classroomId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient();
  const usesCustom = await classroomUsesCustomTemplates(supabase, classroomId);
  if (!usesCustom) return false;

  const { data: member } = await supabase
    .from("classroom_members")
    .select("skills_assessed_at")
    .eq("classroom_id", classroomId)
    .eq("user_id", userId)
    .maybeSingle();

  return !member?.skills_assessed_at;
}
