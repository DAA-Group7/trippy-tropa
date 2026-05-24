import { routes } from "@/lib/constants/routes";

export const GROUP_WORKSPACE_TABS = [
  "board",
  "members",
  "chat",
  "files",
] as const;

export type GroupWorkspaceTab = (typeof GROUP_WORKSPACE_TABS)[number];

export function parseGroupWorkspaceTab(
  raw: string | null | undefined
): GroupWorkspaceTab {
  if (
    raw === "board" ||
    raw === "members" ||
    raw === "chat" ||
    raw === "files"
  ) {
    return raw;
  }
  return "board";
}

/** Student group workspace URL with optional tab (board omits query). */
export function studentGroupWorkspacePath(
  classroomId: string,
  tab: GroupWorkspaceTab = "board"
): string {
  const base = routes.student.group(classroomId);
  return tab === "board" ? base : `${base}?tab=${tab}`;
}
