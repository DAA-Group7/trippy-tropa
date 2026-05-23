import type { NotificationKind } from "@/types/database";

export type NotificationIcon = "group" | "warning" | "forum" | "task";

export function iconForKind(kind: NotificationKind): NotificationIcon {
  switch (kind) {
    case "group_assigned":
      return "group";
    case "task_assigned":
    case "task_updated":
      return "task";
    case "classroom_joined":
      return "forum";
    case "deadline":
      return "warning";
    default:
      return "forum";
  }
}

export function formatTimeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) {
    const m = Math.floor(diffSec / 60);
    return `${m} minute${m === 1 ? "" : "s"} ago`;
  }
  if (diffSec < 86400) {
    const h = Math.floor(diffSec / 3600);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }
  const d = Math.floor(diffSec / 86400);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}
