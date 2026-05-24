import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getStudentGroupWorkspace } from "@/app/actions/groups";
import { getGroupMessages } from "@/app/actions/messages";
import { getStudentKanbanTasks } from "@/app/actions/tasks";
import { getSessionUser } from "@/lib/auth/session";
import { routes } from "@/lib/constants/routes";
import { StudentGroupWorkspaceView } from "@/components/student/student-group-workspace-view";

export const metadata = { title: "Group workspace" };

async function GroupWorkspaceContent({
  classroomId,
}: {
  classroomId: string;
}) {
  const { user, profile } = await getSessionUser();

  if (!user || profile?.role !== "student") {
    redirect(routes.login);
  }

  if (!profile.skills_completed) {
    redirect(routes.onboarding);
  }

  const data = await getStudentGroupWorkspace(classroomId);

  if (!data) {
    notFound();
  }

  const [initialMessages, kanban] = await Promise.all([
    data.group ? getGroupMessages(data.group.id) : Promise.resolve([]),
    data.group ? getStudentKanbanTasks(classroomId) : Promise.resolve(null),
  ]);

  return (
    <StudentGroupWorkspaceView
      data={data}
      initialMessages={initialMessages}
      kanbanTasks={kanban?.tasks ?? []}
    />
  );
}

export default async function GroupWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1280px] p-8 text-sm text-[#505f76]">
          Loading workspace…
        </div>
      }
    >
      <GroupWorkspaceContent classroomId={id} />
    </Suspense>
  );
}
