import { notFound, redirect } from "next/navigation";
import { getStudentGroupWorkspace } from "@/app/actions/groups";
import { getSessionUser } from "@/lib/auth/session";
import { routes } from "@/lib/constants/routes";
import { StudentGroupWorkspaceView } from "@/components/student/student-group-workspace-view";

export const metadata = { title: "Group workspace" };

export default async function GroupWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await getSessionUser();

  if (!user || profile?.role !== "student") {
    redirect(routes.login);
  }

  if (!profile.skills_completed) {
    redirect(routes.onboarding);
  }

  const data = await getStudentGroupWorkspace(id);

  if (!data) {
    notFound();
  }

  return <StudentGroupWorkspaceView data={data} />;
}
