"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  buildEstimateMap,
  countMatrixCells,
  getEstimateHours,
  type EstimateMap,
} from "@/lib/tasks/estimate-matrix";
import { createClient } from "@/lib/supabase/server";
import { routes } from "@/lib/constants/routes";

const upsertEstimateSchema = z.object({
  taskId: z.string().uuid(),
  hours: z.coerce
    .number()
    .min(0.25, "Minimum 0.25 hours")
    .max(200, "Maximum 200 hours"),
});

export type GroupTimeEstimatesMatrix = {
  groupId: string;
  members: { id: string; name: string; isLeader: boolean }[];
  tasks: { id: string; title: string }[];
  /** userId → taskId → hours (null = not submitted) */
  cells: Record<string, Record<string, number | null>>;
  currentUserId: string;
  filledCells: number;
  totalCells: number;
  isComplete: boolean;
};

export type ClassroomEstimateStatus = {
  filledCells: number;
  totalCells: number;
  isComplete: boolean;
  groupBreakdown: { groupId: string; groupName: string; filled: number; total: number }[];
};

function displayName(fullName: string | null, email: string): string {
  if (fullName?.trim()) return fullName.trim();
  return email.split("@")[0] ?? "Student";
}

function cellsFromMap(
  memberIds: string[],
  taskIds: string[],
  map: EstimateMap
): Record<string, Record<string, number | null>> {
  const cells: Record<string, Record<string, number | null>> = {};
  for (const userId of memberIds) {
    cells[userId] = {};
    for (const taskId of taskIds) {
      cells[userId][taskId] = getEstimateHours(map, userId, taskId);
    }
  }
  return cells;
}

export async function getGroupTimeEstimatesMatrix(
  groupId: string
): Promise<GroupTimeEstimatesMatrix | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: group } = await supabase
      .from("groups")
      .select("id, leader_id, classroom_id")
      .eq("id", groupId)
      .maybeSingle();

    if (!group) return null;

    const { data: membership } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: classroom } = await supabase
      .from("classrooms")
      .select("created_by")
      .eq("id", group.classroom_id)
      .maybeSingle();

    const isOfficer = classroom?.created_by === user.id;
    if (!membership && !isOfficer) return null;

    const { data: memberRows } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId);

    const memberIds = (memberRows ?? []).map((m) => m.user_id as string);

    const { data: profiles } = memberIds.length
      ? await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", memberIds)
      : { data: [] };

    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

    const { data: taskRows } = await supabase
      .from("tasks")
      .select("id, title")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });

    const members = memberIds.map((userId) => {
      const profile = profileById.get(userId);
      return {
        id: userId,
        name: profile
          ? displayName(profile.full_name, profile.email)
          : "Member",
        isLeader: userId === group.leader_id,
      };
    });

    const tasks = (taskRows ?? []).map((t) => ({
      id: t.id,
      title: t.title,
    }));

    const taskIds = tasks.map((t) => t.id);

    let map: EstimateMap = new Map();
    if (taskIds.length > 0 && memberIds.length > 0) {
      const { data: estimateRows } = await supabase
        .from("task_time_estimates")
        .select("task_id, user_id, estimated_hours")
        .in("task_id", taskIds);

      map = buildEstimateMap(estimateRows ?? []);
    }

    const { filled, total } = countMatrixCells(memberIds, taskIds, map);

    return {
      groupId,
      members,
      tasks,
      cells: cellsFromMap(memberIds, taskIds, map),
      currentUserId: user.id,
      filledCells: filled,
      totalCells: total,
      isComplete: total > 0 && filled === total,
    };
  } catch {
    return null;
  }
}

export async function upsertTaskTimeEstimate(
  input: z.infer<typeof upsertEstimateSchema>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = upsertEstimateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not signed in." };

    const { data: task } = await supabase
      .from("tasks")
      .select("id, group_id")
      .eq("id", parsed.data.taskId)
      .maybeSingle();

    if (!task) return { ok: false, error: "Task not found." };

    const { data: membership } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("group_id", task.group_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return { ok: false, error: "You must be in this group to submit estimates." };
    }

    const { data: existing } = await supabase
      .from("task_time_estimates")
      .select("task_id")
      .eq("task_id", parsed.data.taskId)
      .eq("user_id", user.id)
      .maybeSingle();

    const payload = {
      task_id: parsed.data.taskId,
      user_id: user.id,
      estimated_hours: parsed.data.hours,
      updated_at: new Date().toISOString(),
    };

    const { error } = existing
      ? await supabase
          .from("task_time_estimates")
          .update({
            estimated_hours: payload.estimated_hours,
            updated_at: payload.updated_at,
          })
          .eq("task_id", parsed.data.taskId)
          .eq("user_id", user.id)
      : await supabase.from("task_time_estimates").insert(payload);

    if (error) return { ok: false, error: error.message };

    const { data: group } = await supabase
      .from("groups")
      .select("classroom_id")
      .eq("id", task.group_id)
      .maybeSingle();

    if (group?.classroom_id) {
      revalidatePath(routes.student.group(group.classroom_id));
      revalidatePath(routes.officer.tasks(group.classroom_id));
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save estimate." };
  }
}

/** Officer: completion across all groups in a classroom (for auto-assign gate). */
export async function getClassroomEstimateStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  classroomId: string
): Promise<ClassroomEstimateStatus> {
  const empty: ClassroomEstimateStatus = {
    filledCells: 0,
    totalCells: 0,
    isComplete: true,
    groupBreakdown: [],
  };

  const { data: groups } = await supabase
    .from("groups")
    .select("id, name")
    .eq("classroom_id", classroomId);

  if (!groups?.length) return empty;

  let filledCells = 0;
  let totalCells = 0;
  const groupBreakdown: ClassroomEstimateStatus["groupBreakdown"] = [];

  for (const group of groups) {
    const { data: members } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", group.id);

    const { data: tasks } = await supabase
      .from("tasks")
      .select("id")
      .eq("group_id", group.id);

    const memberIds = (members ?? []).map((m) => m.user_id as string);
    const taskIds = (tasks ?? []).map((t) => t.id);

    if (taskIds.length === 0 || memberIds.length === 0) {
      groupBreakdown.push({
        groupId: group.id,
        groupName: group.name,
        filled: 0,
        total: 0,
      });
      continue;
    }

    const { data: estimateRows } = await supabase
      .from("task_time_estimates")
      .select("task_id, user_id, estimated_hours")
      .in("task_id", taskIds);

    const map = buildEstimateMap(estimateRows ?? []);
    const { filled, total } = countMatrixCells(memberIds, taskIds, map);

    filledCells += filled;
    totalCells += total;
    groupBreakdown.push({
      groupId: group.id,
      groupName: group.name,
      filled,
      total,
    });
  }

  return {
    filledCells,
    totalCells,
    isComplete: totalCells === 0 || filledCells === totalCells,
    groupBreakdown,
  };
}

/** Load all estimates for tasks in the given groups (officer auto-assign). */
export async function loadEstimatesForGroups(
  supabase: Awaited<ReturnType<typeof createClient>>,
  groupIds: string[]
): Promise<EstimateMap> {
  if (groupIds.length === 0) return new Map();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id")
    .in("group_id", groupIds);

  const taskIds = (tasks ?? []).map((t) => t.id);
  if (taskIds.length === 0) return new Map();

  const { data: estimateRows } = await supabase
    .from("task_time_estimates")
    .select("task_id, user_id, estimated_hours")
    .in("task_id", taskIds);

  return buildEstimateMap(estimateRows ?? []);
}
