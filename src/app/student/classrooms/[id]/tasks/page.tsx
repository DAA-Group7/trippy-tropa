import { notFound, redirect } from "next/navigation";
import { getStudentKanbanTasks } from "@/app/actions/tasks";
import { getSessionUser } from "@/lib/auth/session";
import { routes } from "@/lib/constants/routes";
import { StudentKanbanView } from "@/components/student/student-kanban-view";

export const metadata = { title: "Task board" };

export default async function StudentTasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await getSessionUser();

  if (!user || profile?.role !== "student") {
    redirect(routes.login);
  }

  const data = await getStudentKanbanTasks(id);

  if (!data) {
    notFound();
  }

  return (
    <StudentKanbanView
      classroomId={id}
      classroomName={data.classroomName}
      groupName={data.groupName}
      tasks={data.tasks}
    />
  );
}
