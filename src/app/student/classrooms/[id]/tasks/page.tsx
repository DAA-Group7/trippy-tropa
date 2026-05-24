import { redirect } from "next/navigation";
import { studentGroupWorkspacePath } from "@/lib/constants/group-workspace";

export const metadata = { title: "Task board" };

/** Legacy route — Kanban lives on the group workspace Board tab. */
export default async function StudentTasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(studentGroupWorkspacePath(id, "board"));
}
