import { Suspense } from "react";
import { getNotifications } from "@/app/actions/notifications";
import { getStudentDashboardOverview } from "@/app/actions/student-dashboard";
import { StudentDashboardView } from "@/components/student/student-dashboard-view";
import { getSessionUser } from "@/lib/auth/session";

export const metadata = { title: "Dashboard" };

function firstName(fullName: string | null | undefined, email: string | undefined) {
  if (fullName?.trim()) {
    return fullName.trim().split(/\s+/)[0] ?? "there";
  }
  if (email) return email.split("@")[0] ?? "there";
  return "there";
}

export default async function StudentDashboardPage() {
  const { user, profile } = await getSessionUser();

  let notifications: Awaited<ReturnType<typeof getNotifications>> = [];
  let overview: Awaited<ReturnType<typeof getStudentDashboardOverview>> = {
    classrooms: [],
    activeTasks: [],
  };

  try {
    [notifications, overview] = await Promise.all([
      user ? getNotifications() : Promise.resolve([]),
      getStudentDashboardOverview(),
    ]);
  } catch (err) {
    console.error("[student/dashboard] load failed:", err);
  }

  return (
    <Suspense fallback={null}>
      <StudentDashboardView
        userId={user?.id ?? ""}
        studentFirstName={firstName(profile?.full_name, profile?.email)}
        initialNotifications={notifications}
        classrooms={overview.classrooms}
        activeTasks={overview.activeTasks}
      />
    </Suspense>
  );
}
