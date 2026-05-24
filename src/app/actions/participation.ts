"use server";

import { createClient } from "@/lib/supabase/server";
import {
  buildActivityTrend,
  formatLastActive,
  isOlderThanDays,
  isoToUtcDateKey,
  last7DayKeys,
  maxIso,
  type ActivityTrendPoint,
} from "@/lib/officer/participation-metrics";

export type StudentParticipationRow = {
  userId: string;
  name: string;
  email: string;
  groupName: string | null;
  isLeader: boolean;
  skillsCompleted: boolean;
  messagesSent7d: number;
  tasksMoved7d: number;
  assignedTaskCount: number;
  lastActiveAt: string | null;
  lastActiveLabel: string;
  isAtRisk: boolean;
  atRiskReasons: string[];
};

export type ClassroomParticipationData = {
  classroomId: string;
  activityTrend: ActivityTrendPoint[];
  students: StudentParticipationRow[];
  summary: {
    enrolled: number;
    atRiskCount: number;
    activeLast7d: number;
    skillsAssessed: number;
  };
};

function displayName(fullName: string | null, email: string): string {
  if (fullName?.trim()) return fullName.trim();
  return email.split("@")[0] ?? "Student";
}

export async function getClassroomParticipation(
  classroomId: string
): Promise<ClassroomParticipationData | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: classroom } = await supabase
      .from("classrooms")
      .select("id, created_by")
      .eq("id", classroomId)
      .maybeSingle();

    if (!classroom || classroom.created_by !== user.id) return null;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
    const sinceIso = sevenDaysAgo.toISOString();
    const trendKeys = new Set(last7DayKeys());

    const { data: members } = await supabase
      .from("classroom_members")
      .select("user_id, joined_at")
      .eq("classroom_id", classroomId);

    const memberIds = (members ?? []).map((m) => m.user_id as string);
    if (memberIds.length === 0) {
      return {
        classroomId,
        activityTrend: buildActivityTrend([], []),
        students: [],
        summary: {
          enrolled: 0,
          atRiskCount: 0,
          activeLast7d: 0,
          skillsAssessed: 0,
        },
      };
    }

    const joinedAtByUser = new Map(
      (members ?? []).map((m) => [m.user_id as string, m.joined_at as string])
    );

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name, skills_completed")
      .in("id", memberIds);

    const { data: groups } = await supabase
      .from("groups")
      .select("id, name, leader_id")
      .eq("classroom_id", classroomId);

    const groupIds = (groups ?? []).map((g) => g.id);
    const groupNameById = new Map((groups ?? []).map((g) => [g.id, g.name]));
    const leaderGroupByUser = new Map<string, string>();
    for (const g of groups ?? []) {
      if (g.leader_id) leaderGroupByUser.set(g.leader_id as string, g.name);
    }

    const { data: groupMembers } = groupIds.length
      ? await supabase
          .from("group_members")
          .select("user_id, group_id")
          .in("group_id", groupIds)
      : { data: [] };

    const groupNameByUser = new Map<string, string>();
    for (const row of groupMembers ?? []) {
      const name = groupNameById.get(row.group_id as string);
      if (name) groupNameByUser.set(row.user_id as string, name);
    }

    const { data: ratings } = await supabase
      .from("skill_ratings")
      .select("user_id, updated_at")
      .in("user_id", memberIds);

    const ratingUpdatedByUser = new Map(
      (ratings ?? []).map((r) => [r.user_id as string, r.updated_at as string])
    );

    const { data: tasks } = groupIds.length
      ? await supabase
          .from("tasks")
          .select("id, assigned_to, status, updated_at, created_at")
          .in("group_id", groupIds)
      : { data: [] };

    const taskUpdateDatesForTrend: string[] = [];
    const tasksByAssignee = new Map<
      string,
      { moved7d: number; assigned: number; lastTaskAt: string | null }
    >();

    for (const task of tasks ?? []) {
      const updatedAt = (task.updated_at ?? task.created_at) as string;
      const createdAt = task.created_at as string;
      const status = task.status as string;

      if (status !== "todo" || updatedAt !== createdAt) {
        taskUpdateDatesForTrend.push(updatedAt);
      }

      const assigneeId = task.assigned_to as string | null;
      if (!assigneeId || !memberIds.includes(assigneeId)) continue;

      const bucket = tasksByAssignee.get(assigneeId) ?? {
        moved7d: 0,
        assigned: 0,
        lastTaskAt: null,
      };
      bucket.assigned += 1;

      const updatedKey = isoToUtcDateKey(updatedAt);
      if (
        trendKeys.has(updatedKey) &&
        status !== "todo" &&
        updatedAt !== createdAt
      ) {
        bucket.moved7d += 1;
      }

      bucket.lastTaskAt = maxIso([bucket.lastTaskAt, updatedAt]);
      tasksByAssignee.set(assigneeId, bucket);
    }

    const { data: messages } = groupIds.length
      ? await supabase
          .from("group_messages")
          .select("user_id, created_at")
          .in("group_id", groupIds)
          .gte("created_at", sinceIso)
      : { data: [] };

    const messageDatesForTrend: string[] = [];
    const messagesByUser = new Map<string, number>();
    const lastMessageByUser = new Map<string, string>();

    for (const msg of messages ?? []) {
      const uid = msg.user_id as string;
      const createdAt = msg.created_at as string;
      messageDatesForTrend.push(createdAt);
      if (memberIds.includes(uid)) {
        messagesByUser.set(uid, (messagesByUser.get(uid) ?? 0) + 1);
        const prev = lastMessageByUser.get(uid);
        if (!prev || new Date(createdAt) > new Date(prev)) {
          lastMessageByUser.set(uid, createdAt);
        }
      }
    }

    const taskIds = (tasks ?? []).map((t) => t.id);
    const { data: estimates } = taskIds.length
      ? await supabase
          .from("task_time_estimates")
          .select("user_id, updated_at, task_id")
          .in("task_id", taskIds)
      : { data: [] };

    const lastEstimateByUser = new Map<string, string>();
    for (const row of estimates ?? []) {
      const uid = row.user_id as string;
      const updatedAt = row.updated_at as string;
      const prev = lastEstimateByUser.get(uid);
      if (!prev || new Date(updatedAt) > new Date(prev)) {
        lastEstimateByUser.set(uid, updatedAt);
      }
    }

    const activityTrend = buildActivityTrend(
      taskUpdateDatesForTrend,
      messageDatesForTrend
    );

    const students: StudentParticipationRow[] = (profiles ?? [])
      .map((p) => {
        const userId = p.id;
        const taskStats = tasksByAssignee.get(userId);
        const messagesSent7d = messagesByUser.get(userId) ?? 0;
        const tasksMoved7d = taskStats?.moved7d ?? 0;
        const assignedTaskCount = taskStats?.assigned ?? 0;

        const lastActiveAt = maxIso([
          lastMessageByUser.get(userId),
          lastEstimateByUser.get(userId),
          taskStats?.lastTaskAt,
          ratingUpdatedByUser.get(userId),
          joinedAtByUser.get(userId),
        ]);

        const atRiskReasons: string[] = [];
        if (!p.skills_completed) {
          atRiskReasons.push("Skill assessment incomplete");
        }
        if (isOlderThanDays(lastActiveAt, 7)) {
          atRiskReasons.push("No activity in 7+ days");
        }
        if (
          assignedTaskCount > 0 &&
          tasksMoved7d === 0 &&
          messagesSent7d === 0 &&
          isOlderThanDays(lastActiveAt, 7)
        ) {
          atRiskReasons.push("Assigned tasks but no recent engagement");
        }

        const groupName =
          groupNameByUser.get(userId) ??
          (leaderGroupByUser.has(userId)
            ? leaderGroupByUser.get(userId)!
            : null);

        return {
          userId,
          name: displayName(p.full_name, p.email),
          email: p.email,
          groupName,
          isLeader: leaderGroupByUser.has(userId),
          skillsCompleted: p.skills_completed,
          messagesSent7d,
          tasksMoved7d,
          assignedTaskCount,
          lastActiveAt,
          lastActiveLabel: formatLastActive(lastActiveAt),
          isAtRisk: atRiskReasons.length > 0,
          atRiskReasons,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const activeLast7d = students.filter(
      (s) => s.lastActiveAt && !isOlderThanDays(s.lastActiveAt, 7)
    ).length;

    return {
      classroomId,
      activityTrend,
      students,
      summary: {
        enrolled: students.length,
        atRiskCount: students.filter((s) => s.isAtRisk).length,
        activeLast7d,
        skillsAssessed: students.filter((s) => s.skillsCompleted).length,
      },
    };
  } catch {
    return null;
  }
}
