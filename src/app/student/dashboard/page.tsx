import { Suspense } from "react";
import { getNotifications } from "@/app/actions/notifications";
import { StudentDashboardView } from "@/components/student/student-dashboard-view";
import { getSessionUser } from "@/lib/auth/session";

export const metadata = { title: "Dashboard" };

export default async function StudentDashboardPage() {
  const { user } = await getSessionUser();
  const notifications = user ? await getNotifications() : [];

  return (
    <Suspense fallback={null}>
      <StudentDashboardView
        userId={user?.id ?? ""}
        initialNotifications={notifications}
      />
    </Suspense>
  );
}
