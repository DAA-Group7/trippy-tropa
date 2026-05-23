import { notFound, redirect } from "next/navigation";
import { getStudentAssignmentResults } from "@/app/actions/tasks";
import { getSessionUser } from "@/lib/auth/session";
import { routes } from "@/lib/constants/routes";
import { StudentAssignmentsView } from "@/components/student/student-assignments-view";

export const metadata = { title: "Task assignments" };

export default async function TaskAssignmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await getSessionUser();

  if (!user || profile?.role !== "student") {
    redirect(routes.login);
  }

  const data = await getStudentAssignmentResults(id);

  if (!data) {
    notFound();
  }

  return <StudentAssignmentsView data={data} />;
}
