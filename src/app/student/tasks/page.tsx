import { redirect } from "next/navigation";
import { getStudentTasksHub } from "@/app/actions/student-dashboard";
import { StudentTasksView } from "@/components/student/student-tasks-view";
import { studentGroupWorkspacePath } from "@/lib/constants/group-workspace";

export const metadata = { title: "My tasks" };

export default async function StudentTasksHubPage() {
  const data = await getStudentTasksHub();

  const withGroup = data.classrooms.filter((c) => c.hasGroup);
  if (withGroup.length === 1) {
    redirect(studentGroupWorkspacePath(withGroup[0]!.id, "board"));
  }

  return <StudentTasksView data={data} />;
}
