import { Suspense } from "react";
import { getNotifications } from "@/app/actions/notifications";
import { getStudentDashboardOverview } from "@/app/actions/student-dashboard";
import { StudentDashboardView } from "@/components/student/student-dashboard-view";
import { getSessionUser } from "@/lib/auth/session";

export const metadata = { title: "Dashboard" };

export default async function StudentDashboardPage() {
  const { user } = await getSessionUser();
  const [notifications, overview] = await Promise.all([
    user ? getNotifications() : Promise.resolve([]),
    getStudentDashboardOverview(),
  ]);

  return (
    <Suspense fallback={null}>
      <StudentDashboardView
        userId={user?.id ?? ""}
        initialNotifications={notifications}
        classrooms={overview.classrooms}
        activeTasks={overview.activeTasks}
      />
    </Suspense>
  );
}
