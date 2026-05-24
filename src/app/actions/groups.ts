"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  averageSkill,
  initialsFromName,
} from "@/lib/groups/helpers";
import { buildJoinUrl } from "@/lib/invite";
import { notifyGroupAssignments } from "@/app/actions/notifications";
import { createClient } from "@/lib/supabase/server";
import { routes } from "@/lib/constants/routes";
import { recordClassroomActivity } from "@/lib/activity/record";
import { createLogger, maskUserId } from "@/lib/logger";
import type { SkillRatings } from "@/types/database";

const log = createLogger("groups");

const publishGroupSchema = z.object({
  name: z.string().min(1),
  memberIds: z.array(z.string().uuid()),
  leaderId: z.string().uuid().nullable(),
});

const publishGroupsSchema = z.object({
  classroomId: z.string().uuid(),
  groups: z.array(publishGroupSchema).min(1),
});

export type GroupStudent = {
  id: string;
  name: string;
  initials: string;
  averageSkill: number;
  skills: SkillRatings;
};

export type GroupGenerationContext = {
  classroomId: string;
  classroomName: string;
  inviteUrl: string;
  maxGroups: number;
  students: GroupStudent[];
  existingGroups: EditableGroupSnapshot[];
};

export type EditableGroupSnapshot = {
  id: string;
  name: string;
  memberIds: string[];
  leaderId: string | null;
};

export type ManagedGroup = {
  id: string;
  name: string;
  leaderId: string | null;
  leaderName: string;
  leaderInitials: string;
  members: { id: string; name: string; initials: string }[];
  progressStatus: string;
  progressLabel: string;
  progressPercent: number;
};

export type StudentGroupWorkspaceData = {
  classroomId: string;
  classroomName: string;
  group: {
    id: string;
    name: string;
    progressStatus: string;
    progressLabel: string;
    progressPercent: number;
    members: {
      id: string;
      name: string;
      initials: string;
      isLeader: boolean;
      averageSkill: number | null;
    }[];
  } | null;
  taskStats: { total: number; done: number };
};

type OfficerContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
};

async function getOfficerContext(): Promise<OfficerContext | null> {
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

function displayName(fullName: string | null, email: string): string {
  if (fullName?.trim()) return fullName.trim();
  return email.split("@")[0] ?? "Student";
}

async function fetchEligibleStudents(
  ctx: OfficerContext,
  classroomId: string
): Promise<GroupStudent[]> {
  const { data: members } = await ctx.supabase
    .from("classroom_members")
    .select("user_id")
    .eq("classroom_id", classroomId);

  const memberIds = (members ?? []).map((m) => m.user_id as string);
  if (memberIds.length === 0) return [];

  const { data: profiles } = await ctx.supabase
    .from("profiles")
    .select("id, email, full_name, skills_completed")
    .in("id", memberIds);

  const { data: ratings } = await ctx.supabase
    .from("skill_ratings")
    .select("user_id, communication, leadership, technical, teamwork")
    .in("user_id", memberIds);

  const ratingsByUser = new Map(
    (ratings ?? []).map((r) => [
      r.user_id,
      {
        communication: r.communication,
        leadership: r.leadership,
        technical: r.technical,
        teamwork: r.teamwork,
      } satisfies SkillRatings,
    ])
  );

  return (profiles ?? [])
    .filter((p) => p.skills_completed && ratingsByUser.has(p.id))
    .map((p) => {
      const skills = ratingsByUser.get(p.id)!;
      const name = displayName(p.full_name, p.email);
      return {
        id: p.id,
        name,
        initials: initialsFromName(name),
        averageSkill: averageSkill(skills),
        skills,
      };
    });
}

async function fetchExistingGroupSnapshots(
  ctx: OfficerContext,
  classroomId: string
): Promise<EditableGroupSnapshot[]> {
  const { data: groups } = await ctx.supabase
    .from("groups")
    .select("id, name, leader_id")
    .eq("classroom_id", classroomId)
    .order("created_at", { ascending: true });

  if (!groups?.length) return [];

  const groupIds = groups.map((g) => g.id);
  const { data: members } = await ctx.supabase
    .from("group_members")
    .select("group_id, user_id")
    .in("group_id", groupIds);

  const membersByGroup = new Map<string, string[]>();
  members?.forEach((m) => {
    const gid = m.group_id as string;
    const list = membersByGroup.get(gid) ?? [];
    list.push(m.user_id as string);
    membersByGroup.set(gid, list);
  });

  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    memberIds: membersByGroup.get(g.id) ?? [],
    leaderId: g.leader_id,
  }));
}

function computeTaskProgress(
  tasks: { status: string }[]
): { percent: number; label: string } {
  if (tasks.length === 0) return { percent: 0, label: "0%" };
  const done = tasks.filter((t) => t.status === "done").length;
  const percent = Math.round((done / tasks.length) * 100);
  return { percent, label: `${percent}%` };
}

export async function getGroupGenerationContext(
  classroomId: string
): Promise<GroupGenerationContext | null> {
  try {
    const ctx = await getOfficerContext();
    if (!ctx) return null;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const { data: classroom } = await ctx.supabase
      .from("classrooms")
      .select("id, name, max_groups, invite_code")
      .eq("id", classroomId)
      .eq("created_by", ctx.userId)
      .maybeSingle();

    if (!classroom) return null;

    const students = await fetchEligibleStudents(ctx, classroomId);
    const existingGroups = await fetchExistingGroupSnapshots(ctx, classroomId);

    return {
      classroomId: classroom.id,
      classroomName: classroom.name,
      inviteUrl: buildJoinUrl(classroom.invite_code, baseUrl),
      maxGroups: classroom.max_groups,
      students,
      existingGroups,
    };
  } catch {
    return null;
  }
}

export async function publishGroups(
  input: z.infer<typeof publishGroupsSchema>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = publishGroupsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid group data." };
  }

  const { classroomId, groups } = parsed.data;

  log.info("publish_attempt", {
    classroomId,
    groupCount: groups.length,
  });

  try {
    const ctx = await getOfficerContext();
    if (!ctx) {
      log.warn("publish_unauthenticated");
      return { ok: false, error: "You must be signed in as an officer." };
    }

    const { data: classroom } = await ctx.supabase
      .from("classrooms")
      .select("id")
      .eq("id", classroomId)
      .eq("created_by", ctx.userId)
      .maybeSingle();

    if (!classroom) {
      return { ok: false, error: "Classroom not found or access denied." };
    }

    const eligible = await fetchEligibleStudents(ctx, classroomId);
    const eligibleIds = new Set(eligible.map((s) => s.id));
    const assigned = new Set<string>();

    for (const group of groups) {
      for (const memberId of group.memberIds) {
        if (!eligibleIds.has(memberId)) {
          return {
            ok: false,
            error: "All members must be enrolled students with completed skills.",
          };
        }
        if (assigned.has(memberId)) {
          return { ok: false, error: "Each student can only belong to one group." };
        }
        assigned.add(memberId);
        if (group.leaderId && !group.memberIds.includes(group.leaderId)) {
          return { ok: false, error: "Group leader must be a member of the group." };
        }
      }
    }

    for (const id of eligibleIds) {
      if (!assigned.has(id)) {
        return {
          ok: false,
          error: "Place every eligible student in a group before publishing.",
        };
      }
    }

    const { error: deleteError } = await ctx.supabase
      .from("groups")
      .delete()
      .eq("classroom_id", classroomId);

    if (deleteError) {
      return { ok: false, error: deleteError.message };
    }

    const notifyRows: {
      userId: string;
      groupName: string;
      groupId: string;
    }[] = [];

    for (const group of groups) {
      const { data: inserted, error: groupError } = await ctx.supabase
        .from("groups")
        .insert({
          classroom_id: classroomId,
          name: group.name,
          leader_id: group.leaderId,
          progress_status: "not_started",
        })
        .select("id")
        .single();

      if (groupError || !inserted) {
        return { ok: false, error: groupError?.message ?? "Failed to create group." };
      }

      if (group.memberIds.length > 0) {
        const { error: membersError } = await ctx.supabase
          .from("group_members")
          .insert(
            group.memberIds.map((userId) => ({
              group_id: inserted.id,
              user_id: userId,
            }))
          );

        if (membersError) {
          return { ok: false, error: membersError.message };
        }

        for (const userId of group.memberIds) {
          notifyRows.push({
            userId,
            groupName: group.name,
            groupId: inserted.id,
          });
        }
      }
    }

    await notifyGroupAssignments(classroomId, notifyRows);

    await recordClassroomActivity(ctx.supabase, {
      classroomId,
      actorId: ctx.userId,
      eventType: "groups_published",
      payload: { groupCount: groups.length },
    });

    revalidatePath(routes.officer.dashboard);
    revalidatePath(routes.officer.classroom(classroomId));
    revalidatePath(routes.officer.groups(classroomId));
    revalidatePath(routes.officer.generateGroups(classroomId));
    revalidatePath(routes.student.group(classroomId));

    log.info("publish_success", {
      classroomId,
      groupCount: groups.length,
      officerId: maskUserId(ctx.userId),
    });

    return { ok: true };
  } catch (err) {
    log.error("publish_exception", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return { ok: false, error: "Could not save groups." };
  }
}

export async function getManagedGroups(
  classroomId: string
): Promise<{ classroomName: string; inviteUrl: string; groups: ManagedGroup[] } | null> {
  try {
    const ctx = await getOfficerContext();
    if (!ctx) return null;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const { data: classroom } = await ctx.supabase
      .from("classrooms")
      .select("id, name, invite_code")
      .eq("id", classroomId)
      .eq("created_by", ctx.userId)
      .maybeSingle();

    if (!classroom) return null;

    const { data: groups } = await ctx.supabase
      .from("groups")
      .select("id, name, leader_id, progress_status")
      .eq("classroom_id", classroomId)
      .order("created_at", { ascending: true });

    if (!groups?.length) {
      return {
        classroomName: classroom.name,
        inviteUrl: buildJoinUrl(classroom.invite_code, baseUrl),
        groups: [],
      };
    }

    const groupIds = groups.map((g) => g.id);

    const { data: members } = await ctx.supabase
      .from("group_members")
      .select("group_id, user_id")
      .in("group_id", groupIds);

    const userIds = [...new Set((members ?? []).map((m) => m.user_id as string))];

    const { data: profiles } = userIds.length
      ? await ctx.supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", userIds)
      : { data: [] };

    const profileById = new Map(
      (profiles ?? []).map((p) => [p.id, p])
    );

    const { data: tasks } = await ctx.supabase
      .from("tasks")
      .select("group_id, status")
      .in("group_id", groupIds);

    const tasksByGroup = new Map<string, { status: string }[]>();
    tasks?.forEach((t) => {
      const gid = t.group_id as string;
      const list = tasksByGroup.get(gid) ?? [];
      list.push({ status: t.status as string });
      tasksByGroup.set(gid, list);
    });

    const membersByGroup = new Map<string, string[]>();
    members?.forEach((m) => {
      const gid = m.group_id as string;
      const list = membersByGroup.get(gid) ?? [];
      list.push(m.user_id as string);
      membersByGroup.set(gid, list);
    });

    const managed: ManagedGroup[] = groups.map((g) => {
      const memberIds = membersByGroup.get(g.id) ?? [];
      const leaderProfile = g.leader_id
        ? profileById.get(g.leader_id)
        : null;
      const leaderName = leaderProfile
        ? displayName(leaderProfile.full_name, leaderProfile.email)
        : "Unassigned";
      const groupTasks = tasksByGroup.get(g.id) ?? [];
      const { percent, label } = computeTaskProgress(groupTasks);
      const status =
        percent === 100 && groupTasks.length > 0 ? "done" : g.progress_status;

      return {
        id: g.id,
        name: g.name,
        leaderId: g.leader_id,
        leaderName,
        leaderInitials: initialsFromName(leaderName),
        members: memberIds.map((uid) => {
          const p = profileById.get(uid);
          const name = p ? displayName(p.full_name, p.email) : "Student";
          return { id: uid, name, initials: initialsFromName(name) };
        }),
        progressStatus: status,
        progressLabel: label,
        progressPercent: percent,
      };
    });

    return {
      classroomName: classroom.name,
      inviteUrl: buildJoinUrl(classroom.invite_code, baseUrl),
      groups: managed,
    };
  } catch {
    return null;
  }
}

export async function getStudentGroupWorkspace(
  classroomId: string
): Promise<StudentGroupWorkspaceData | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: membership } = await supabase
      .from("classroom_members")
      .select("classroom_id")
      .eq("classroom_id", classroomId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) return null;

    const { data: classroom } = await supabase
      .from("classrooms")
      .select("id, name")
      .eq("id", classroomId)
      .maybeSingle();

    if (!classroom) return null;

    const { data: classroomGroups } = await supabase
      .from("groups")
      .select("id, name, leader_id, progress_status")
      .eq("classroom_id", classroomId);

    const groupIds = (classroomGroups ?? []).map((g) => g.id);
    if (groupIds.length === 0) {
      return {
        classroomId: classroom.id,
        classroomName: classroom.name,
        group: null,
        taskStats: { total: 0, done: 0 },
      };
    }

    const { data: myMembership } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", user.id)
      .in("group_id", groupIds)
      .maybeSingle();

    if (!myMembership) {
      return {
        classroomId: classroom.id,
        classroomName: classroom.name,
        group: null,
        taskStats: { total: 0, done: 0 },
      };
    }

    const groupData = classroomGroups!.find(
      (g) => g.id === myMembership.group_id
    )!;

    const { data: allMembers } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupData.id);

    const memberIds = (allMembers ?? []).map((m) => m.user_id as string);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", memberIds);

    const { data: ratings } = await supabase
      .from("skill_ratings")
      .select("user_id, communication, leadership, technical, teamwork")
      .in("user_id", memberIds);

    const ratingsByUser = new Map(
      (ratings ?? []).map((r) => [r.user_id, r])
    );

    const { data: tasks } = await supabase
      .from("tasks")
      .select("status")
      .eq("group_id", groupData.id);

    const taskList = tasks ?? [];
    const done = taskList.filter((t) => t.status === "done").length;
    const { percent, label } = computeTaskProgress(
      taskList.map((t) => ({ status: t.status as string }))
    );

    return {
      classroomId: classroom.id,
      classroomName: classroom.name,
      group: {
        id: groupData.id,
        name: groupData.name,
        progressStatus: groupData.progress_status,
        progressLabel: label,
        progressPercent: percent,
        members: (profiles ?? []).map((p) => {
          const name = displayName(p.full_name, p.email);
          const r = ratingsByUser.get(p.id);
          const avg = r
            ? averageSkill({
                communication: r.communication,
                leadership: r.leadership,
                technical: r.technical,
                teamwork: r.teamwork,
              })
            : null;
          return {
            id: p.id,
            name,
            initials: initialsFromName(name),
            isLeader: p.id === groupData.leader_id,
            averageSkill: avg,
          };
        }),
      },
      taskStats: { total: taskList.length, done },
    };
  } catch {
    return null;
  }
}
