import type { ClassroomActivityEventType } from "@/types/database";

export function displayActorName(
  fullName: string | null | undefined,
  email: string | null | undefined
): string {
  const name = fullName?.trim();
  if (name) return name;
  if (email) return email.split("@")[0] ?? "Someone";
  return "Someone";
}

export function formatActivitySummary(
  eventType: ClassroomActivityEventType,
  payload: Record<string, unknown>,
  actorName: string | null
): string {
  switch (eventType) {
    case "enrolled": {
      const student =
        (payload.studentName as string | undefined) ?? actorName ?? "A student";
      return `${student} joined the classroom`;
    }
    case "groups_published": {
      const count = Number(payload.groupCount ?? 0);
      return count > 0
        ? `Published ${count} group${count === 1 ? "" : "s"}`
        : "Published groups";
    }
    case "task_created": {
      const title = (payload.taskTitle as string | undefined) ?? "a task";
      return `Created task “${title}”`;
    }
    case "task_deleted": {
      const title = (payload.taskTitle as string | undefined) ?? "a task";
      return `Deleted task “${title}”`;
    }
    case "assignment_run": {
      const count = Number(payload.assignedCount ?? 0);
      return count > 0
        ? `Auto-assigned ${count} task${count === 1 ? "" : "s"}`
        : "Ran task auto-assign";
    }
    case "assignment_override": {
      const title = (payload.taskTitle as string | undefined) ?? "a task";
      const toName =
        (payload.toStudentName as string | undefined) ?? "a student";
      return `Reassigned “${title}” to ${toName}`;
    }
    default:
      return "Classroom activity";
  }
}

export type ActivityFeedIcon = "enroll" | "groups" | "task" | "assign";

export function iconForActivityType(
  eventType: ClassroomActivityEventType
): ActivityFeedIcon {
  switch (eventType) {
    case "enrolled":
      return "enroll";
    case "groups_published":
      return "groups";
    case "assignment_run":
    case "assignment_override":
      return "assign";
    case "task_created":
    case "task_deleted":
    default:
      return "task";
  }
}
