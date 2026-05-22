import { KanbanBoard } from "@/components/tasks/kanban-board";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = { title: "Task board" };

export default async function StudentTasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Task board"
        description={`Kanban for classroom ${id} — drag cards between columns.`}
      />
      <KanbanBoard />
    </div>
  );
}
