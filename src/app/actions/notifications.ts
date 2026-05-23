"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { iconForKind, formatTimeAgo } from "@/lib/notifications/helpers";
import { routes } from "@/lib/constants/routes";
import type { NotificationKind } from "@/types/database";

export type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  kind: NotificationKind;
  icon: ReturnType<typeof iconForKind>;
  read: boolean;
  createdAt: string;
  timeAgo: string;
  classroomId: string | null;
  relatedId: string | null;
};

type NotificationInsert = {
  userId: string;
  title: string;
  body?: string | null;
  kind: NotificationKind;
  relatedId?: string | null;
  classroomId?: string | null;
};

async function insertNotification(
  supabase: Awaited<ReturnType<typeof createClient>>,
  row: NotificationInsert
): Promise<void> {
  const { error } = await supabase.from("notifications").insert({
    user_id: row.userId,
    title: row.title,
    body: row.body ?? null,
    kind: row.kind,
    related_id: row.relatedId ?? null,
    classroom_id: row.classroomId ?? null,
    read: false,
  });

  if (error) {
    console.error("[notifications] insert failed:", error.message);
  }
}

export async function getNotifications(
  limit = 20
): Promise<NotificationItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("notifications")
    .select("id, title, body, kind, read, created_at, classroom_id, related_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    kind: n.kind as NotificationKind,
    icon: iconForKind(n.kind as NotificationKind),
    read: n.read,
    createdAt: n.created_at,
    timeAgo: formatTimeAgo(n.created_at),
    classroomId: n.classroom_id,
    relatedId: n.related_id,
  }));
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  return count ?? 0;
}

export async function markNotificationRead(
  notificationId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath(routes.student.dashboard);
  revalidatePath(routes.officer.dashboard);
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);

  if (error) return { ok: false, error: error.message };

  revalidatePath(routes.student.dashboard);
  revalidatePath(routes.officer.dashboard);
  return { ok: true };
}

/** Notify students they were placed in a published group */
export async function notifyGroupAssignments(
  classroomId: string,
  assignments: {
    userId: string;
    groupName: string;
    groupId: string;
  }[]
): Promise<void> {
  if (assignments.length === 0) return;

  const supabase = await createClient();

  await Promise.all(
    assignments.map((a) =>
      insertNotification(supabase, {
        userId: a.userId,
        title: `Assigned to ${a.groupName}`,
        body: "Your instructor published new groups for this classroom.",
        kind: "group_assigned",
        relatedId: a.groupId,
        classroomId,
      })
    )
  );
}

export async function notifyTaskAssigned(
  userId: string,
  taskTitle: string,
  classroomId: string,
  taskId: string
): Promise<void> {
  const supabase = await createClient();
  await insertNotification(supabase, {
    userId,
    title: `New task: ${taskTitle}`,
    body: "A task was assigned to you based on skills and availability.",
    kind: "task_assigned",
    relatedId: taskId,
    classroomId,
  });
}

export async function notifyTaskAssignmentsBulk(
  rows: {
    userId: string;
    taskTitle: string;
    classroomId: string;
    taskId: string;
  }[]
): Promise<void> {
  const supabase = await createClient();
  await Promise.all(
    rows.map((r) =>
      insertNotification(supabase, {
        userId: r.userId,
        title: `New task: ${r.taskTitle}`,
        body: "Auto-assigned based on your skills and available hours.",
        kind: "task_assigned",
        relatedId: r.taskId,
        classroomId: r.classroomId,
      })
    )
  );
}

export async function notifyTaskStatusUpdated(
  recipientIds: string[],
  taskTitle: string,
  statusLabel: string,
  classroomId: string,
  taskId: string,
  actorId: string
): Promise<void> {
  const targets = recipientIds.filter((id) => id !== actorId);
  if (targets.length === 0) return;

  const supabase = await createClient();
  await Promise.all(
    targets.map((userId) =>
      insertNotification(supabase, {
        userId,
        title: `Task updated: ${taskTitle}`,
        body: `Status changed to ${statusLabel}.`,
        kind: "task_updated",
        relatedId: taskId,
        classroomId,
      })
    )
  );
}

export async function notifyStudentJoinedClassroom(
  studentUserId: string,
  classroomId: string,
  classroomName: string
): Promise<void> {
  const supabase = await createClient();

  await insertNotification(supabase, {
    userId: studentUserId,
    title: `Joined ${classroomName}`,
    body: "You are enrolled. Complete skill assessment if you have not already.",
    kind: "classroom_joined",
    classroomId,
  });

  const { data: classroom } = await supabase
    .from("classrooms")
    .select("created_by, name")
    .eq("id", classroomId)
    .maybeSingle();

  if (classroom?.created_by) {
    await insertNotification(supabase, {
      userId: classroom.created_by,
      title: "New student enrolled",
      body: `A student joined ${classroom.name}.`,
      kind: "classroom_joined",
      classroomId,
    });
  }
}
