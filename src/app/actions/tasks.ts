"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  assignTasksOptimally,
  computeTaskMatchScore,
  type StudentCapacity,
  type TaskToAssign,
} from "@/lib/algorithms/task-assigner";
import {
  getClassroomEstimateStatus,
  loadEstimatesForGroups,
  type ClassroomEstimateStatus,
} from "@/app/actions/time-estimates";
import {
  buildGroupAssignmentMatrices,
  type GroupAssignmentMatrix,
} from "@/lib/tasks/assignment-matrix-data";
import {
  buildEstimateMap,
  getEstimateHours,
} from "@/lib/tasks/estimate-matrix";
import {
  notifyTaskAssignmentsBulk,
  notifyTaskReassigned,
  notifyTaskStatusUpdated,
  notifyTaskUnassigned,
} from "@/app/actions/notifications";
import { recordClassroomActivity } from "@/lib/activity/record";
import {
  DEFAULT_STUDENT_CAPACITY_HOURS,
  formatRequiredSkills,
  parseRequiredSkills,
  statusLabel,
} from "@/lib/tasks/helpers";
import { createClient } from "@/lib/supabase/server";
import { routes } from "@/lib/constants/routes";
import type { SkillRatings, TaskStatus } from "@/types/database";

const requiredSkillsSchema = z
  .object({
    communication: z.number().int().min(1).max(5).optional(),
    leadership: z.number().int().min(1).max(5).optional(),
    technical: z.number().int().min(1).max(5).optional(),
    teamwork: z.number().int().min(1).max(5).optional(),
  })
  .optional();

const createTaskSchema = z.object({
  groupId: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  deadline: z.string().optional(),
  requiredSkills: requiredSkillsSchema,
});

const updateTaskStatusSchema = z.object({
  taskId: z.string().uuid(),
  status: z.enum(["todo", "in_progress", "review", "done"]),
});

const overrideTaskAssignmentSchema = z.object({
  taskId: z.string().uuid(),
  classroomId: z.string().uuid(),
  newAssigneeId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export type GroupMemberOption = { id: string; name: string };

type OfficerContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
};

export type TaskGroupOption = {
  id: string;
  name: string;
};

export type ClassroomTask = {
  id: string;
  groupId: string;
  groupName: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignedTo: string | null;
  assigneeName: string | null;
  deadline: string | null;
  requiredSkills: Partial<SkillRatings>;
  assignmentMatchScore: number | null;
  assignmentReason: string | null;
};

export type AssignmentRow = {
  taskId: string;
  taskTitle: string;
  groupId: string;
  groupName: string;
  studentId: string;
  studentName: string;
  estimatedHours: number;
  matchScore: number;
  reason: string;
};

export type { GroupAssignmentMatrix } from "@/lib/tasks/assignment-matrix-data";

export type OfficerTasksContext = {
  classroomId: string;
  classroomName: string;
  groups: TaskGroupOption[];
  tasks: ClassroomTask[];
  assignmentRows: AssignmentRow[];
  assignmentMatrices: GroupAssignmentMatrix[];
  groupMembersByGroupId: Record<string, GroupMemberOption[]>;
  estimateStatus: ClassroomEstimateStatus;
};

export type KanbanTaskData = {
  id: string;
  title: string;
  assignee: string;
  assigneeId: string | null;
  deadline: string;
  /** Current user's hours estimate for this task */
  myEstimateHours: number | null;
  status: TaskStatus;
  canDrag: boolean;
};

export type StudentAssignmentsData = {
  classroomId: string;
  classroomName: string;
  groupName: string | null;
  assignments: {
    taskId: string;
    taskTitle: string;
    assigneeName: string;
    isCurrentUser: boolean;
    estimatedHours: number;
    requiredSkillsLabel: string;
    matchScore: number | null;
    reason: string | null;
  }[];
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

async function assertOwnsClassroom(
  ctx: OfficerContext,
  classroomId: string
): Promise<boolean> {
  const { data } = await ctx.supabase
    .from("classrooms")
    .select("id")
    .eq("id", classroomId)
    .eq("created_by", ctx.userId)
    .maybeSingle();
  return !!data;
}

function revalidateTaskPaths(classroomId: string) {
  revalidatePath(routes.officer.dashboard);
  revalidatePath(routes.officer.tasks(classroomId));
  revalidatePath(routes.student.tasks(classroomId));
  revalidatePath(routes.student.assignments(classroomId));
  revalidatePath(routes.student.group(classroomId));
  revalidatePath(routes.officer.groups(classroomId));
}

function mapTaskRow(
  task: {
    id: string;
    group_id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    assigned_to: string | null;
    deadline: string | null;
    estimated_hours: number | null;
    required_skills: unknown;
    assignment_match_score: number | null;
    assignment_reason: string | null;
  },
  groupName: string,
  profileById: Map<string, { full_name: string | null; email: string }>
): ClassroomTask {
  const profile = task.assigned_to
    ? profileById.get(task.assigned_to)
    : null;

  return {
    id: task.id,
    groupId: task.group_id,
    groupName,
    title: task.title,
    description: task.description,
    status: task.status,
    assignedTo: task.assigned_to,
    assigneeName: profile
      ? displayName(profile.full_name, profile.email)
      : null,
    deadline: task.deadline,
    requiredSkills: parseRequiredSkills(task.required_skills),
    assignmentMatchScore: task.assignment_match_score,
    assignmentReason: task.assignment_reason,
  };
}

export async function getOfficerTasksContext(
  classroomId: string
): Promise<OfficerTasksContext | null> {
  try {
    const ctx = await getOfficerContext();
    if (!ctx || !(await assertOwnsClassroom(ctx, classroomId))) return null;

    const { data: classroom } = await ctx.supabase
      .from("classrooms")
      .select("id, name")
      .eq("id", classroomId)
      .single();

    const { data: groups } = await ctx.supabase
      .from("groups")
      .select("id, name")
      .eq("classroom_id", classroomId)
      .order("created_at", { ascending: true });

    const groupOptions: TaskGroupOption[] = (groups ?? []).map((g) => ({
      id: g.id,
      name: g.name,
    }));

    const groupIds = groupOptions.map((g) => g.id);
    if (groupIds.length === 0) {
      return {
        classroomId,
        classroomName: classroom?.name ?? "Classroom",
        groups: [],
        tasks: [],
        assignmentRows: [],
        assignmentMatrices: [],
        groupMembersByGroupId: {},
        estimateStatus: {
          filledCells: 0,
          totalCells: 0,
          isComplete: true,
          groupBreakdown: [],
        },
      };
    }

    const { data: memberRows } = await ctx.supabase
      .from("group_members")
      .select("group_id, user_id")
      .in("group_id", groupIds);

    const memberUserIds = [
      ...new Set((memberRows ?? []).map((m) => m.user_id as string)),
    ];

    const { data: memberProfiles } = memberUserIds.length
      ? await ctx.supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", memberUserIds)
      : { data: [] };

    const memberProfileById = new Map(
      (memberProfiles ?? []).map((p) => [p.id, p])
    );

    const membersByGroup = new Map<string, { id: string; name: string }[]>();
    for (const row of memberRows ?? []) {
      const gid = row.group_id as string;
      const uid = row.user_id as string;
      const profile = memberProfileById.get(uid);
      const name = profile
        ? displayName(profile.full_name, profile.email)
        : "Student";
      const list = membersByGroup.get(gid) ?? [];
      list.push({ id: uid, name });
      membersByGroup.set(gid, list);
    }
    for (const [, list] of membersByGroup) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    const estimateStatus = await getClassroomEstimateStatus(
      ctx.supabase,
      classroomId
    );
    const estimateMap = await loadEstimatesForGroups(ctx.supabase, groupIds);

    const groupNameById = new Map(groupOptions.map((g) => [g.id, g.name]));

    const { data: taskRows } = await ctx.supabase
      .from("tasks")
      .select(
        "id, group_id, title, description, status, assigned_to, deadline, estimated_hours, required_skills, assignment_match_score, assignment_reason"
      )
      .in("group_id", groupIds)
      .order("created_at", { ascending: true });

    const assigneeIds = [
      ...new Set(
        (taskRows ?? [])
          .map((t) => t.assigned_to)
          .filter((id): id is string => !!id)
      ),
    ];

    const { data: profiles } = assigneeIds.length
      ? await ctx.supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", assigneeIds)
      : { data: [] };

    const profileById = new Map(
      (profiles ?? []).map((p) => [p.id, p])
    );

    const tasks = (taskRows ?? []).map((t) =>
      mapTaskRow(
        t as Parameters<typeof mapTaskRow>[0],
        groupNameById.get(t.group_id) ?? "Group",
        profileById
      )
    );

    const groupMembersByGroupId: Record<string, GroupMemberOption[]> = {};
    for (const [gid, list] of membersByGroup) {
      groupMembersByGroupId[gid] = list;
    }

    const assignmentRows: AssignmentRow[] = tasks
      .filter((t) => t.assignedTo && t.assigneeName)
      .map((t) => ({
        taskId: t.id,
        taskTitle: t.title,
        groupId: t.groupId,
        groupName: t.groupName,
        studentId: t.assignedTo!,
        studentName: t.assigneeName!,
        estimatedHours:
          getEstimateHours(estimateMap, t.assignedTo!, t.id) ?? 0,
        matchScore: t.assignmentMatchScore ?? 0,
        reason: t.assignmentReason ?? "Manually assigned",
      }));

    const assignmentMatrices = buildGroupAssignmentMatrices(
      groupOptions,
      membersByGroup,
      (taskRows ?? []).map((t) => ({
        id: t.id,
        group_id: t.group_id,
        title: t.title,
        assigned_to: t.assigned_to,
        assignment_match_score: t.assignment_match_score,
      })),
      estimateMap
    );

    return {
      classroomId,
      classroomName: classroom?.name ?? "Classroom",
      groups: groupOptions,
      tasks,
      assignmentRows,
      assignmentMatrices,
      groupMembersByGroupId,
      estimateStatus,
    };
  } catch {
    return null;
  }
}

export async function overrideTaskAssignment(
  input: z.infer<typeof overrideTaskAssignmentSchema>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = overrideTaskAssignmentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  try {
    const ctx = await getOfficerContext();
    if (!ctx || !(await assertOwnsClassroom(ctx, parsed.data.classroomId))) {
      return { ok: false, error: "Access denied." };
    }

    const { data: task } = await ctx.supabase
      .from("tasks")
      .select(
        "id, title, group_id, assigned_to, required_skills"
      )
      .eq("id", parsed.data.taskId)
      .maybeSingle();

    if (!task) return { ok: false, error: "Task not found." };

    const { data: group } = await ctx.supabase
      .from("groups")
      .select("id, classroom_id")
      .eq("id", task.group_id)
      .maybeSingle();

    if (!group || group.classroom_id !== parsed.data.classroomId) {
      return { ok: false, error: "Task is not in this classroom." };
    }

    if (task.assigned_to === parsed.data.newAssigneeId) {
      return { ok: false, error: "That member is already assigned." };
    }

    const { data: membership } = await ctx.supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", task.group_id)
      .eq("user_id", parsed.data.newAssigneeId)
      .maybeSingle();

    if (!membership) {
      return {
        ok: false,
        error: "The selected student must be a member of this task's group.",
      };
    }

    const { data: rating } = await ctx.supabase
      .from("skill_ratings")
      .select("communication, leadership, technical, teamwork")
      .eq("user_id", parsed.data.newAssigneeId)
      .maybeSingle();

    if (!rating) {
      return {
        ok: false,
        error: "The selected student has not completed skill ratings.",
      };
    }

    const { data: assigneeProfile } = await ctx.supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", parsed.data.newAssigneeId)
      .maybeSingle();

    const requiredSkills = parseRequiredSkills(task.required_skills);
    const matchScore = computeTaskMatchScore(
      rating as SkillRatings,
      requiredSkills
    );

    const reasonTrimmed = parsed.data.reason?.trim() || null;
    const assignmentReason = reasonTrimmed
      ? `Manual override: ${reasonTrimmed}`
      : "Manual override by instructor";

    const { error: auditError } = await ctx.supabase
      .from("assignment_audit")
      .insert({
        task_id: task.id,
        from_student_id: task.assigned_to,
        to_student_id: parsed.data.newAssigneeId,
        changed_by: ctx.userId,
        reason: reasonTrimmed,
      });

    if (auditError) {
      return { ok: false, error: auditError.message };
    }

    const { error: updateError } = await ctx.supabase
      .from("tasks")
      .update({
        assigned_to: parsed.data.newAssigneeId,
        assignment_match_score: matchScore,
        assignment_reason: assignmentReason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", task.id);

    if (updateError) return { ok: false, error: updateError.message };

    const toStudentName = assigneeProfile
      ? displayName(assigneeProfile.full_name, assigneeProfile.email)
      : "Student";

    await recordClassroomActivity(ctx.supabase, {
      classroomId: parsed.data.classroomId,
      actorId: ctx.userId,
      eventType: "assignment_override",
      payload: {
        taskId: task.id,
        taskTitle: task.title,
        fromStudentId: task.assigned_to,
        toStudentId: parsed.data.newAssigneeId,
        toStudentName,
      },
    });

    await notifyTaskReassigned(
      parsed.data.newAssigneeId,
      task.title,
      parsed.data.classroomId,
      task.id,
      reasonTrimmed
    );

    if (
      task.assigned_to &&
      task.assigned_to !== parsed.data.newAssigneeId
    ) {
      await notifyTaskUnassigned(
        task.assigned_to,
        task.title,
        parsed.data.classroomId,
        task.id
      );
    }

    revalidateTaskPaths(parsed.data.classroomId);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not override assignment." };
  }
}

export async function createTask(
  classroomId: string,
  input: z.infer<typeof createTaskSchema>
): Promise<{ ok: true; taskId: string } | { ok: false; error: string }> {
  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const ctx = await getOfficerContext();
    if (!ctx || !(await assertOwnsClassroom(ctx, classroomId))) {
      return { ok: false, error: "Access denied." };
    }

    const { data: group } = await ctx.supabase
      .from("groups")
      .select("id, classroom_id")
      .eq("id", parsed.data.groupId)
      .eq("classroom_id", classroomId)
      .maybeSingle();

    if (!group) {
      return { ok: false, error: "Group not found in this classroom." };
    }

    const skills = parsed.data.requiredSkills ?? {};
    const hasSkill = Object.values(skills).some((v) => v != null);
    const requiredSkills = hasSkill ? skills : { technical: 3 };

    const { data, error } = await ctx.supabase
      .from("tasks")
      .insert({
        group_id: parsed.data.groupId,
        title: parsed.data.title,
        description: parsed.data.description || null,
        estimated_hours: null,
        deadline: parsed.data.deadline
          ? new Date(parsed.data.deadline).toISOString()
          : null,
        required_skills: requiredSkills,
        status: "todo",
      })
      .select("id")
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "Failed to create task." };
    }

    await recordClassroomActivity(ctx.supabase, {
      classroomId,
      actorId: ctx.userId,
      eventType: "task_created",
      payload: { taskId: data.id, taskTitle: parsed.data.title },
    });

    revalidateTaskPaths(classroomId);
    return { ok: true, taskId: data.id };
  } catch {
    return { ok: false, error: "Could not create task." };
  }
}

export async function deleteTask(
  taskId: string,
  classroomId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const ctx = await getOfficerContext();
    if (!ctx || !(await assertOwnsClassroom(ctx, classroomId))) {
      return { ok: false, error: "Access denied." };
    }

    const { data: taskRow } = await ctx.supabase
      .from("tasks")
      .select("title")
      .eq("id", taskId)
      .maybeSingle();

    const { error } = await ctx.supabase.from("tasks").delete().eq("id", taskId);

    if (error) return { ok: false, error: error.message };

    await recordClassroomActivity(ctx.supabase, {
      classroomId,
      actorId: ctx.userId,
      eventType: "task_deleted",
      payload: {
        taskId,
        taskTitle: taskRow?.title ?? "Task",
      },
    });

    revalidateTaskPaths(classroomId);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not delete task." };
  }
}

export type AutoAssignOptions = {
  /** When true, re-optimizes all tasks and may change existing assignees. */
  forceReassign?: boolean;
};

export async function autoAssignTasks(
  classroomId: string,
  options: AutoAssignOptions = {}
): Promise<
  | { ok: true; assignedCount: number; skippedAssigned: number }
  | { ok: false; error: string }
> {
  const forceReassign = options.forceReassign === true;
  try {
    const ctx = await getOfficerContext();
    if (!ctx || !(await assertOwnsClassroom(ctx, classroomId))) {
      return { ok: false, error: "Access denied." };
    }

    const { data: groups } = await ctx.supabase
      .from("groups")
      .select("id")
      .eq("classroom_id", classroomId);

    if (!groups?.length) {
      return { ok: false, error: "Create groups before assigning tasks." };
    }

    const estimateStatus = await getClassroomEstimateStatus(
      ctx.supabase,
      classroomId
    );

    if (estimateStatus.totalCells > 0 && !estimateStatus.isComplete) {
      return {
        ok: false,
        error: `All group members must complete the time estimate matrix before auto-assign (${estimateStatus.filledCells}/${estimateStatus.totalCells} cells filled).`,
      };
    }

    const groupIds = groups.map((g) => g.id);
    const classroomEstimateMap = await loadEstimatesForGroups(
      ctx.supabase,
      groupIds
    );

    let assignedCount = 0;
    let skippedAssigned = 0;
    const notifyRows: {
      userId: string;
      taskTitle: string;
      classroomId: string;
      taskId: string;
    }[] = [];

    for (const group of groups) {
      const { data: members } = await ctx.supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", group.id);

      const memberIds = (members ?? []).map((m) => m.user_id as string);
      if (memberIds.length === 0) continue;

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

      const students: StudentCapacity[] = (profiles ?? [])
        .filter((p) => p.skills_completed && ratingsByUser.has(p.id))
        .map((p) => ({
          id: p.id,
          name: displayName(p.full_name, p.email),
          skills: ratingsByUser.get(p.id)!,
          availableHours: DEFAULT_STUDENT_CAPACITY_HOURS,
        }));

      if (students.length === 0) continue;

      const { data: taskRows } = await ctx.supabase
        .from("tasks")
        .select("id, title, required_skills, assigned_to")
        .eq("group_id", group.id);

      const allTasks = taskRows ?? [];
      if (allTasks.length === 0) continue;

      const alreadyAssigned = allTasks.filter((t) => t.assigned_to);
      skippedAssigned += forceReassign
        ? 0
        : alreadyAssigned.length;

      const tasksForRun = forceReassign
        ? allTasks
        : allTasks.filter((t) => !t.assigned_to);

      if (tasksForRun.length === 0) continue;

      const initialRemaining = forceReassign
        ? undefined
        : (() => {
            const remaining = new Map(
              students.map((s) => [s.id, DEFAULT_STUDENT_CAPACITY_HOURS])
            );
            for (const task of alreadyAssigned) {
              const assigneeId = task.assigned_to as string;
              const hours = getEstimateHours(
                classroomEstimateMap,
                assigneeId,
                task.id
              );
              if (hours != null && hours > 0) {
                remaining.set(
                  assigneeId,
                  (remaining.get(assigneeId) ?? 0) - hours
                );
              }
            }
            return remaining;
          })();

      const toAssign: TaskToAssign[] = tasksForRun.map((t) => ({
        id: t.id,
        title: t.title,
        requiredSkills: parseRequiredSkills(t.required_skills),
      }));

      const assignments = assignTasksOptimally(
        toAssign,
        students,
        (studentId, taskId) =>
          getEstimateHours(classroomEstimateMap, studentId, taskId),
        initialRemaining
      );

      const taskById = new Map(allTasks.map((t) => [t.id, t]));

      for (const assignment of assignments) {
        const task = taskById.get(assignment.taskId);
        const previousAssignee = task?.assigned_to ?? null;

        const { error } = await ctx.supabase
          .from("tasks")
          .update({
            assigned_to: assignment.studentId,
            assignment_match_score: assignment.matchScore,
            assignment_reason: assignment.reason,
            updated_at: new Date().toISOString(),
          })
          .eq("id", assignment.taskId);

        if (!error) {
          const assigneeChanged =
            previousAssignee !== assignment.studentId;
          if (!previousAssignee) {
            assignedCount += 1;
          } else if (forceReassign && assigneeChanged) {
            assignedCount += 1;
          }

          if (task && assigneeChanged) {
            notifyRows.push({
              userId: assignment.studentId,
              taskTitle: task.title,
              classroomId,
              taskId: assignment.taskId,
            });
          }
        }
      }
    }

    if (assignedCount === 0) {
      if (!forceReassign && skippedAssigned > 0) {
        return {
          ok: true,
          assignedCount: 0,
          skippedAssigned,
        };
      }
      return {
        ok: false,
        error:
          "No tasks to assign. Add tasks and ensure members have skill ratings.",
      };
    }

    if (notifyRows.length > 0) {
      await notifyTaskAssignmentsBulk(notifyRows);
    }

    await recordClassroomActivity(ctx.supabase, {
      classroomId,
      actorId: ctx.userId,
      eventType: "assignment_run",
      payload: {
        assignedCount,
        forceReassign,
        skippedAssigned,
      },
    });

    revalidateTaskPaths(classroomId);
    return { ok: true, assignedCount, skippedAssigned };
  } catch {
    return { ok: false, error: "Could not run auto-assign." };
  }
}

export async function updateTaskStatus(
  input: z.infer<typeof updateTaskStatusSchema>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = updateTaskStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid status." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not signed in." };

    const { data: task } = await supabase
      .from("tasks")
      .select("id, title, assigned_to, group_id")
      .eq("id", parsed.data.taskId)
      .maybeSingle();

    if (!task) return { ok: false, error: "Task not found." };

    const { data: group } = await supabase
      .from("groups")
      .select("classroom_id")
      .eq("id", task.group_id)
      .maybeSingle();

    if (!group) return { ok: false, error: "Task group not found." };

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const isOfficer = profile?.role === "officer";
    const isAssignee =
      profile?.role === "student" && task.assigned_to === user.id;

    if (isOfficer) {
      const { data: classroom } = await supabase
        .from("classrooms")
        .select("created_by")
        .eq("id", group.classroom_id)
        .maybeSingle();

      if (classroom?.created_by !== user.id) {
        return { ok: false, error: "You cannot update this task." };
      }
    } else if (!isAssignee) {
      return { ok: false, error: "You cannot update this task." };
    }

    const { error } = await supabase
      .from("tasks")
      .update({
        status: parsed.data.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.taskId);

    if (error) return { ok: false, error: error.message };

    const { data: members } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", task.group_id);

    const { data: classroom } = await supabase
      .from("classrooms")
      .select("created_by")
      .eq("id", group.classroom_id)
      .maybeSingle();

    const recipientIds = [
      ...(members ?? []).map((m) => m.user_id as string),
      ...(classroom?.created_by ? [classroom.created_by] : []),
      ...(task.assigned_to ? [task.assigned_to] : []),
    ];

    await notifyTaskStatusUpdated(
      [...new Set(recipientIds)],
      task.title,
      statusLabel(parsed.data.status),
      group.classroom_id,
      task.id,
      user.id
    );

    revalidateTaskPaths(group.classroom_id);

    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update task." };
  }
}

export async function getStudentKanbanTasks(
  classroomId: string
): Promise<
  | {
      classroomName: string;
      groupName: string;
      groupId: string | null;
      tasks: KanbanTaskData[];
    }
  | null
> {
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
      .select("name")
      .eq("id", classroomId)
      .maybeSingle();

    const { data: groupRows } = await supabase
      .from("groups")
      .select("id, name")
      .eq("classroom_id", classroomId);

    const groupIds = (groupRows ?? []).map((g) => g.id);
    if (groupIds.length === 0) {
      return {
        classroomName: classroom?.name ?? "Classroom",
        groupName: "No group",
        groupId: null,
        tasks: [],
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
        classroomName: classroom?.name ?? "Classroom",
        groupName: "Not assigned",
        groupId: null,
        tasks: [],
      };
    }

    const group = groupRows!.find((g) => g.id === myMembership.group_id)!;

    const { data: taskRows } = await supabase
      .from("tasks")
      .select("id, title, status, assigned_to, deadline")
      .eq("group_id", group.id)
      .order("created_at", { ascending: true });

    const taskIds = (taskRows ?? []).map((t) => t.id);
    const { data: myEstimateRows } = taskIds.length
      ? await supabase
          .from("task_time_estimates")
          .select("task_id, user_id, estimated_hours")
          .in("task_id", taskIds)
          .eq("user_id", user.id)
      : { data: [] };

    const myEstimateByTask = new Map(
      (myEstimateRows ?? []).map((e) => [
        e.task_id,
        Number(e.estimated_hours),
      ])
    );

    const assigneeIds = [
      ...new Set(
        (taskRows ?? [])
          .map((t) => t.assigned_to)
          .filter((id): id is string => !!id)
      ),
    ];

    const { data: profiles } = assigneeIds.length
      ? await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", assigneeIds)
      : { data: [] };

    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

    const tasks: KanbanTaskData[] = (taskRows ?? []).map((t) => {
      const profile = t.assigned_to
        ? profileById.get(t.assigned_to)
        : null;
      const assigneeName = profile
        ? displayName(profile.full_name, profile.email)
        : "Unassigned";

      return {
        id: t.id,
        title: t.title,
        assignee: assigneeName,
        assigneeId: t.assigned_to,
        deadline: t.deadline
          ? new Date(t.deadline).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })
          : "No deadline",
        myEstimateHours: myEstimateByTask.get(t.id) ?? null,
        status: t.status as TaskStatus,
        canDrag: t.assigned_to === user.id,
      };
    });

    return {
      classroomName: classroom?.name ?? "Classroom",
      groupName: group.name,
      groupId: group.id,
      tasks,
    };
  } catch {
    return null;
  }
}

export async function getStudentAssignmentResults(
  classroomId: string
): Promise<StudentAssignmentsData | null> {
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
      .select("name")
      .eq("id", classroomId)
      .maybeSingle();

    const { data: groups } = await supabase
      .from("groups")
      .select("id, name")
      .eq("classroom_id", classroomId);

    const groupIds = (groups ?? []).map((g) => g.id);
    if (groupIds.length === 0) {
      return {
        classroomId,
        classroomName: classroom?.name ?? "Classroom",
        groupName: null,
        assignments: [],
      };
    }

    const { data: myMembership } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", user.id)
      .in("group_id", groupIds)
      .maybeSingle();

    const groupName = myMembership
      ? groups!.find((g) => g.id === myMembership.group_id)?.name ?? null
      : null;

    if (!myMembership) {
      return {
        classroomId,
        classroomName: classroom?.name ?? "Classroom",
        groupName: null,
        assignments: [],
      };
    }

    const { data: taskRows } = await supabase
      .from("tasks")
      .select(
        "id, title, assigned_to, required_skills, assignment_match_score, assignment_reason"
      )
      .eq("group_id", myMembership.group_id)
      .not("assigned_to", "is", null)
      .order("created_at", { ascending: true });

    const taskIds = (taskRows ?? []).map((t) => t.id);
    const { data: estimateRows } = taskIds.length
      ? await supabase
          .from("task_time_estimates")
          .select("task_id, user_id, estimated_hours")
          .in("task_id", taskIds)
      : { data: [] };

    const estimateMap = buildEstimateMap(estimateRows ?? []);

    const assigneeIds = [
      ...new Set((taskRows ?? []).map((t) => t.assigned_to as string)),
    ];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", assigneeIds);

    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

    const assignments = (taskRows ?? []).map((t) => {
      const profile = profileById.get(t.assigned_to as string);
      const name = profile
        ? displayName(profile.full_name, profile.email)
        : "Student";

      return {
        taskId: t.id,
        taskTitle: t.title,
        assigneeName: name,
        isCurrentUser: t.assigned_to === user.id,
        estimatedHours:
          getEstimateHours(
            estimateMap,
            t.assigned_to as string,
            t.id
          ) ?? 0,
        requiredSkillsLabel: formatRequiredSkills(
          parseRequiredSkills(t.required_skills)
        ),
        matchScore: t.assignment_match_score,
        reason: t.assignment_reason,
      };
    });

    return {
      classroomId,
      classroomName: classroom?.name ?? "Classroom",
      groupName,
      assignments,
    };
  } catch {
    return null;
  }
}
