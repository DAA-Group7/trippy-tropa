import {
  mapDbTemplate,
  toCoreSkillRatings,
  weightedTotalFromRatings,
  type ClassroomSkillTemplateRow,
} from "@/lib/skills/classroom-skills";
import type { createClient } from "@/lib/supabase/server";
import type { SkillRatings } from "@/types/database";

export type ResolvedStudentSkills = {
  skills: SkillRatings;
  weightedTotal: number;
  ratingsByMetricKey: Record<string, number>;
};

export async function fetchClassroomSkillTemplates(
  supabase: Awaited<ReturnType<typeof createClient>>,
  classroomId: string
): Promise<ClassroomSkillTemplateRow[]> {
  const { data } = await supabase
    .from("classroom_skill_templates")
    .select(
      "id, classroom_id, metric_key, label, description, tooltip, multiplier, sort_order"
    )
    .eq("classroom_id", classroomId)
    .order("sort_order", { ascending: true });

  return (data ?? []).map(mapDbTemplate);
}

export async function loadStudentSkillsForClassroom(
  supabase: Awaited<ReturnType<typeof createClient>>,
  classroomId: string,
  userIds: string[]
): Promise<Map<string, ResolvedStudentSkills>> {
  const result = new Map<string, ResolvedStudentSkills>();
  if (userIds.length === 0) return result;

  const templates = await fetchClassroomSkillTemplates(supabase, classroomId);

  if (templates.length === 0) {
    const { data: legacy } = await supabase
      .from("skill_ratings")
      .select("user_id, communication, leadership, technical, teamwork")
      .in("user_id", userIds);

    for (const row of legacy ?? []) {
      const skills: SkillRatings = {
        communication: row.communication,
        leadership: row.leadership,
        technical: row.technical,
        teamwork: row.teamwork,
      };
      const ratingsByMetricKey: Record<string, number> = { ...skills };
      result.set(row.user_id, {
        skills,
        weightedTotal:
          skills.communication +
          skills.leadership +
          skills.technical +
          skills.teamwork,
        ratingsByMetricKey,
      });
    }
    return result;
  }

  const { data: ratingRows } = await supabase
    .from("student_classroom_skill_ratings")
    .select("user_id, rating, template_id")
    .eq("classroom_id", classroomId)
    .in("user_id", userIds);

  const templateById = new Map(templates.map((t) => [t.id, t]));

  const ratingsByUser = new Map<string, Record<string, number>>();
  for (const row of ratingRows ?? []) {
    const template = templateById.get(row.template_id as string);
    if (!template) continue;
    const uid = row.user_id as string;
    if (!ratingsByUser.has(uid)) ratingsByUser.set(uid, {});
    ratingsByUser.get(uid)![template.metricKey] = row.rating as number;
  }

  for (const userId of userIds) {
    const ratingsByMetricKey = ratingsByUser.get(userId) ?? {};
    const skills = toCoreSkillRatings(templates, ratingsByMetricKey);
    result.set(userId, {
      skills,
      weightedTotal: weightedTotalFromRatings(templates, ratingsByMetricKey),
      ratingsByMetricKey,
    });
  }

  return result;
}

export async function classroomUsesCustomTemplates(
  supabase: Awaited<ReturnType<typeof createClient>>,
  classroomId: string
): Promise<boolean> {
  const { count } = await supabase
    .from("classroom_skill_templates")
    .select("id", { count: "exact", head: true })
    .eq("classroom_id", classroomId);

  return (count ?? 0) > 0;
}
