"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  assignTasksOptimally,
  type StudentCapacity,
  type TaskToAssign,
} from "@/lib/algorithms/task-assigner";
import {
  notifyTaskAssignmentsBulk,
  notifyTaskStatusUpdated,
} from "@/app/actions/notifications";
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
  estimatedHours: z.coerce.number().positive("Hours must be positive"),
  deadline: z.string().optional(),
  requiredSkills: requiredSkillsSchema,
});

const updateTaskStatusSchema = z.object({
  taskId: z.string().uuid(),
  status: z.enum(["todo", "in_progress", "review", "done"]),
});

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
  estimatedHours: number;
  requiredSkills: Partial<SkillRatings>;
  assignmentMatchScore: number | null;
  assignmentReason: string | null;
};

export type AssignmentRow = {
  taskId: string;
  taskTitle: string;
  groupName: string;
  studentId: string;
  studentName: string;
  estimatedHours: number;
  matchScore: number;
  reason: string;
};

export type OfficerTasksContext = {
  classroomId: string;
  classroomName: string;
  groups: TaskGroupOption[];
  tasks: ClassroomTask[];
  assignmentRows: AssignmentRow[];
};

export type KanbanTaskData = {
  id: string;
  title: string;
  assignee: string;
  assigneeId: string | null;
  deadline: string;
  estimatedHours: number;
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
    estimatedHours: Number(task.estimated_hours ?? 0),
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
      };
    }

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

    const assignmentRows: AssignmentRow[] = tasks
      .filter((t) => t.assignedTo && t.assigneeName)
      .map((t) => ({
        taskId: t.id,
        taskTitle: t.title,
        groupName: t.groupName,
        studentId: t.assignedTo!,
        studentName: t.assigneeName!,
        estimatedHours: t.estimatedHours,
        matchScore: t.assignmentMatchScore ?? 0,
        reason: t.assignmentReason ?? "Manually assigned",
      }));

    return {
      classroomId,
      classroomName: classroom?.name ?? "Classroom",
      groups: groupOptions,
      tasks,
      assignmentRows,
    };
  } catch {
    return null;
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
        estimated_hours: parsed.data.estimatedHours,
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

    const { error } = await ctx.supabase.from("tasks").delete().eq("id", taskId);

    if (error) return { ok: false, error: error.message };

    revalidateTaskPaths(classroomId);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not delete task." };
  }
}

export async function autoAssignTasks(
  classroomId: string
): Promise<
  | { ok: true; assignedCount: number }
  | { ok: false; error: string }
> {
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

    let assignedCount = 0;
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
        .select(
          "id, title, estimated_hours, required_skills, assigned_to"
        )
        .eq("group_id", group.id);

      const toAssign: TaskToAssign[] = (taskRows ?? []).map((t) => ({
        id: t.id,
        title: t.title,
        requiredSkills: parseRequiredSkills(t.required_skills),
        estimatedHours: Number(t.estimated_hours ?? 1),
      }));

      if (toAssign.length === 0) continue;

      const assignments = assignTasksOptimally(toAssign, students);

      const taskById = new Map((taskRows ?? []).map((t) => [t.id, t]));

      for (const assignment of assignments) {
        const { error } = await ctx.supabase
          .from("tasks")
          .update({
            assigned_to: assignment.studentId,
            assignment_match_score: assignment.matchScore,
            assignment_reason: assignment.reason,
          })
          .eq("id", assignment.taskId);

        if (!error) {
          assignedCount += 1;
          const task = taskById.get(assignment.taskId);
          if (task) {
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
      return {
        ok: false,
        error: "No tasks to assign. Add tasks and ensure members have skill ratings.",
      };
    }

    await notifyTaskAssignmentsBulk(notifyRows);
    revalidateTaskPaths(classroomId);
    return { ok: true, assignedCount };
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
      .update({ status: parsed.data.status })
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
      .select(
        "id, title, status, assigned_to, deadline, estimated_hours"
      )
      .eq("group_id", group.id)
      .order("created_at", { ascending: true });

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
        estimatedHours: Number(t.estimated_hours ?? 0),
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
        "id, title, assigned_to, estimated_hours, required_skills, assignment_match_score, assignment_reason"
      )
      .eq("group_id", myMembership.group_id)
      .not("assigned_to", "is", null)
      .order("created_at", { ascending: true });

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
        estimatedHours: Number(t.estimated_hours ?? 0),
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
