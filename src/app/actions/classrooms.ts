"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { seedDefaultClassroomSkillTemplates } from "@/app/actions/classroom-skills";
import { createClient } from "@/lib/supabase/server";
import { SKILL_DEFINITIONS } from "@/lib/constants/skills";
import {
  normalizedWeightedAverage,
  type ClassroomSkillTemplateRow,
} from "@/lib/skills/classroom-skills";
import {
  fetchClassroomSkillTemplates,
  loadStudentSkillsForClassroom,
} from "@/lib/skills/resolve-classroom-student-skills";
import { buildJoinUrl, generateInviteCode } from "@/lib/invite";
import { routes } from "@/lib/constants/routes";
import { createLogger, maskUserId } from "@/lib/logger";
import type { SkillKey, SkillRatings } from "@/types/database";

const log = createLogger("classroom");

const createClassroomSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  subject: z.string().optional(),
  maxGroups: z.coerce.number().int().min(1).max(20),
  rules: z.string().optional(),
});

const SKILL_BAR_CLASSES = [
  "bg-[#004ac6]",
  "bg-[#b4c5ff]",
  "bg-[#505f76]",
  "bg-[#737686]",
] as const;

export type CreateClassroomResult =
  | {
      success: true;
      classroomId: string;
      inviteCode: string;
      inviteUrl: string;
    }
  | { success: false; error: string };

export type DashboardClassroom = {
  id: string;
  name: string;
  subject: string | null;
  inviteCode: string;
  inviteUrl: string;
  memberCount: number;
};

export type OfficerDashboardData = {
  officerName: string;
  classrooms: DashboardClassroom[];
  stats: {
    totalStudents: number;
    groupsCreated: number;
    activeTasks: number;
    tasksNeedingReview: number;
  };
};

export type ClassroomBrief = {
  id: string;
  name: string;
  inviteCode: string;
  inviteUrl: string;
};

export type ClassroomDetail = ClassroomBrief & {
  subject: string | null;
  enrolledCount: number;
  maxGroups: number;
};

export type ClassroomRosterSkillEntry = {
  metricKey: string;
  label: string;
  rating: number;
  multiplier: number;
};

export type ClassroomRosterStudent = {
  id: string;
  name: string;
  email: string;
  skillsCompleted: boolean;
  classroomAssessed: boolean;
  averageSkill: number | null;
  skills: SkillRatings | null;
  skillBreakdown: ClassroomRosterSkillEntry[] | null;
  joinedAt: string;
};

export type ClassroomSkillMetric = {
  key: string;
  label: string;
  average: number;
  percent: number;
  barClass: string;
  multiplier: number;
};

export type ClassroomDetailFull = ClassroomDetail & {
  groupsCount: number;
  skillsAssessedCount: number;
  roster: ClassroomRosterStudent[];
  skillMetrics: ClassroomSkillMetric[];
};

type OfficerContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  officerName: string;
};

async function getOfficerContext(): Promise<OfficerContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "officer") return null;

  const officerName =
    profile.full_name?.trim() || user.email?.split("@")[0] || "Officer";

  return { supabase, userId: user.id, officerName };
}

function averageSkillRating(ratings: SkillRatings): number {
  const sum =
    ratings.communication +
    ratings.leadership +
    ratings.technical +
    ratings.teamwork;
  return Math.round((sum / 4) * 10) / 10;
}

function buildSkillMetricsFromTemplates(
  templates: ClassroomSkillTemplateRow[],
  ratingsByUser: Map<string, Record<string, number>>
): ClassroomSkillMetric[] {
  const userIds = [...ratingsByUser.keys()];
  if (templates.length === 0 || userIds.length === 0) {
    return SKILL_DEFINITIONS.map((skill, index) => ({
      key: skill.key,
      label: skill.label,
      average: 0,
      percent: 0,
      barClass: SKILL_BAR_CLASSES[index % SKILL_BAR_CLASSES.length],
      multiplier: 1,
    }));
  }

  return templates.map((template, index) => {
    const values = userIds
      .map((uid) => ratingsByUser.get(uid)?.[template.metricKey])
      .filter((v): v is number => v != null);
    const average =
      values.length > 0
        ? Math.round(
            (values.reduce((sum, v) => sum + v, 0) / values.length) * 10
          ) / 10
        : 0;
    return {
      key: template.metricKey,
      label: template.label,
      average,
      percent: Math.round((average / 5) * 100),
      barClass: SKILL_BAR_CLASSES[index % SKILL_BAR_CLASSES.length],
      multiplier: template.multiplier,
    };
  });
}

function buildSkillMetrics(
  ratingsList: SkillRatings[]
): ClassroomSkillMetric[] {
  if (ratingsList.length === 0) {
    return SKILL_DEFINITIONS.map((skill, index) => ({
      key: skill.key,
      label: skill.label,
      average: 0,
      percent: 0,
      barClass: SKILL_BAR_CLASSES[index % SKILL_BAR_CLASSES.length],
      multiplier: 1,
    }));
  }

  return SKILL_DEFINITIONS.map((skill, index) => {
    const total = ratingsList.reduce((sum, r) => sum + r[skill.key], 0);
    const average = Math.round((total / ratingsList.length) * 10) / 10;
    return {
      key: skill.key,
      label: skill.label,
      average,
      percent: Math.round((average / 5) * 100),
      barClass: SKILL_BAR_CLASSES[index % SKILL_BAR_CLASSES.length],
      multiplier: 1,
    };
  });
}

function displayName(fullName: string | null, email: string): string {
  if (fullName?.trim()) return fullName.trim();
  return email.split("@")[0] ?? "Student";
}

async function fetchClassroomRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
  officerId: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { data, error } = await supabase
    .from("classrooms")
    .select("id, name, subject, invite_code, max_groups, created_by")
    .eq("id", id)
    .eq("created_by", officerId)
    .maybeSingle();

  if (error || !data) return null;

  const { count } = await supabase
    .from("classroom_members")
    .select("*", { count: "exact", head: true })
    .eq("classroom_id", id);

  return {
    id: data.id,
    name: data.name,
    subject: data.subject,
    inviteCode: data.invite_code,
    inviteUrl: buildJoinUrl(data.invite_code, baseUrl),
    enrolledCount: count ?? 0,
    maxGroups: data.max_groups,
  };
}

export async function getClassroomBrief(
  id: string
): Promise<ClassroomBrief | null> {
  const detail = await getClassroomDetail(id);
  if (!detail) return null;
  return {
    id: detail.id,
    name: detail.name,
    inviteCode: detail.inviteCode,
    inviteUrl: detail.inviteUrl,
  };
}

export async function getClassroomDetail(
  id: string
): Promise<ClassroomDetail | null> {
  try {
    const ctx = await getOfficerContext();
    if (!ctx) return null;
    return fetchClassroomRow(ctx.supabase, id, ctx.userId);
  } catch {
    return null;
  }
}

export async function getClassroomDetailFull(
  id: string
): Promise<ClassroomDetailFull | null> {
  try {
    const ctx = await getOfficerContext();
    if (!ctx) return null;

    const base = await fetchClassroomRow(ctx.supabase, id, ctx.userId);
    if (!base) return null;

    const { data: members } = await ctx.supabase
      .from("classroom_members")
      .select("user_id, joined_at, skills_assessed_at")
      .eq("classroom_id", id)
      .order("joined_at", { ascending: true });

    const memberIds = (members ?? []).map((m) => m.user_id as string);
    const assessedAtByUser = new Map(
      (members ?? []).map((m) => [m.user_id as string, m.skills_assessed_at as string | null])
    );

    let profiles: {
      id: string;
      email: string;
      full_name: string | null;
      skills_completed: boolean;
    }[] = [];

    if (memberIds.length > 0) {
      const { data } = await ctx.supabase
        .from("profiles")
        .select("id, email, full_name, skills_completed")
        .in("id", memberIds);
      profiles = data ?? [];
    }

    const profileById = new Map(profiles.map((p) => [p.id, p]));

    const templates = await fetchClassroomSkillTemplates(ctx.supabase, id);
    const resolvedSkills =
      memberIds.length > 0
        ? await loadStudentSkillsForClassroom(ctx.supabase, id, memberIds)
        : new Map();

    const roster: ClassroomRosterStudent[] = (members ?? []).map((member) => {
      const userId = member.user_id as string;
      const profile = profileById.get(userId);
      const email = profile?.email ?? "unknown@student.local";
      const resolved = resolvedSkills.get(userId);
      const classroomAssessed = Boolean(assessedAtByUser.get(userId));
      const skills = resolved?.skills ?? null;

      const skillBreakdown =
        templates.length > 0 && resolved
          ? templates.map((template) => ({
              metricKey: template.metricKey,
              label: template.label,
              rating: resolved.ratingsByMetricKey[template.metricKey] ?? 0,
              multiplier: template.multiplier,
            }))
          : null;

      const averageSkill = resolved
        ? templates.length > 0
          ? normalizedWeightedAverage(templates, resolved.weightedTotal)
          : skills
            ? averageSkillRating(skills)
            : null
        : null;

      return {
        id: userId,
        name: displayName(profile?.full_name ?? null, email),
        email,
        skillsCompleted: profile?.skills_completed ?? false,
        classroomAssessed,
        averageSkill,
        skills,
        skillBreakdown,
        joinedAt: member.joined_at as string,
      };
    });

    const ratingsByMetricUser = new Map<string, Record<string, number>>();
    for (const [userId, resolved] of resolvedSkills) {
      ratingsByMetricUser.set(userId, resolved.ratingsByMetricKey);
    }

    const ratingsList = [...resolvedSkills.values()].map((r) => r.skills);
    const skillsAssessedCount = roster.filter(
      (s) => s.classroomAssessed || (templates.length === 0 && s.skillsCompleted)
    ).length;

    const { count: groupsCount } = await ctx.supabase
      .from("groups")
      .select("*", { count: "exact", head: true })
      .eq("classroom_id", id);

    return {
      ...base,
      groupsCount: groupsCount ?? 0,
      skillsAssessedCount,
      roster,
      skillMetrics:
        templates.length > 0
          ? buildSkillMetricsFromTemplates(templates, ratingsByMetricUser)
          : buildSkillMetrics(ratingsList),
    };
  } catch {
    return null;
  }
}

export async function getOfficerDashboardData(): Promise<OfficerDashboardData> {
  const empty: OfficerDashboardData = {
    officerName: "Officer",
    classrooms: [],
    stats: {
      totalStudents: 0,
      groupsCreated: 0,
      activeTasks: 0,
      tasksNeedingReview: 0,
    },
  };

  try {
    const ctx = await getOfficerContext();
    if (!ctx) return empty;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const { data: classrooms, error: classroomsError } = await ctx.supabase
      .from("classrooms")
      .select("id, name, subject, invite_code")
      .eq("created_by", ctx.userId)
      .order("created_at", { ascending: false });

    if (classroomsError) return { ...empty, officerName: ctx.officerName };

    const classroomIds = (classrooms ?? []).map((c) => c.id);

    const memberCountByClassroom = new Map<string, number>();
    let totalStudents = 0;

    if (classroomIds.length > 0) {
      const { data: members } = await ctx.supabase
        .from("classroom_members")
        .select("classroom_id")
        .in("classroom_id", classroomIds);

      members?.forEach((m) => {
        const cid = m.classroom_id as string;
        memberCountByClassroom.set(cid, (memberCountByClassroom.get(cid) ?? 0) + 1);
      });
      totalStudents = members?.length ?? 0;
    }

    let groupsCreated = 0;
    let activeTasks = 0;
    let tasksNeedingReview = 0;
    const groupIds: string[] = [];

    if (classroomIds.length > 0) {
      const { data: groups } = await ctx.supabase
        .from("groups")
        .select("id")
        .in("classroom_id", classroomIds);

      groupsCreated = groups?.length ?? 0;
      groupIds.push(...(groups?.map((g) => g.id) ?? []));
    }

    if (groupIds.length > 0) {
      const { count: active } = await ctx.supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .in("group_id", groupIds)
        .neq("status", "done");

      const { count: review } = await ctx.supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .in("group_id", groupIds)
        .eq("status", "review");

      activeTasks = active ?? 0;
      tasksNeedingReview = review ?? 0;
    }

    const dashboardClassrooms: DashboardClassroom[] = (classrooms ?? []).map(
      (c) => ({
        id: c.id,
        name: c.name,
        subject: c.subject,
        inviteCode: c.invite_code,
        inviteUrl: buildJoinUrl(c.invite_code, baseUrl),
        memberCount: memberCountByClassroom.get(c.id) ?? 0,
      })
    );

    return {
      officerName: ctx.officerName,
      classrooms: dashboardClassrooms,
      stats: {
        totalStudents,
        groupsCreated,
        activeTasks,
        tasksNeedingReview,
      },
    };
  } catch {
    return empty;
  }
}

export async function createClassroom(
  input: z.infer<typeof createClassroomSchema>
): Promise<CreateClassroomResult> {
  const parsed = createClassroomSchema.safeParse(input);
  if (!parsed.success) {
    log.warn("create_validation_failed", {
      issues: parsed.error.issues.map((i) => i.message),
    });
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, subject, maxGroups, rules } = parsed.data;
  const inviteCode = generateInviteCode();
  log.info("create_attempt", { name, maxGroups });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = buildJoinUrl(inviteCode, baseUrl);

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      log.warn("create_unauthenticated");
      return { success: false, error: "Sign in as an officer to create classrooms." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "officer") {
      log.warn("create_forbidden_role", {
        userId: maskUserId(user.id),
        role: profile?.role,
      });
      return {
        success: false,
        error: "Only officer accounts can create classrooms.",
      };
    }

    const { data, error } = await supabase
      .from("classrooms")
      .insert({
        name,
        subject: subject || null,
        invite_code: inviteCode,
        max_groups: maxGroups,
        rules: rules || null,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error) {
      log.error("create_insert_failed", {
        userId: maskUserId(user.id),
        message: error.message,
      });
      return {
        success: false,
        error:
          error.message.includes("relation") || error.message.includes("schema")
            ? "Database not ready. Run supabase/migrations in your Supabase project."
            : error.message,
      };
    }

    await seedDefaultClassroomSkillTemplates(supabase, data.id);

    revalidatePath(routes.officer.dashboard);

    log.info("create_success", {
      classroomId: data.id,
      inviteCode,
      userId: maskUserId(user.id),
    });

    return {
      success: true,
      classroomId: data.id,
      inviteCode,
      inviteUrl,
    };
  } catch (err) {
    log.error("create_exception", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return {
      success: false,
      error: "Could not connect to Supabase. Check your environment variables.",
    };
  }
}
