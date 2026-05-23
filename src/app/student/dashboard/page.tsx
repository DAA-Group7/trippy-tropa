import { Suspense } from "react";
import { StudentDashboardView } from "@/components/student/student-dashboard-view";

export const metadata = { title: "Dashboard" };

export default function StudentDashboardPage() {
  return (
    <Suspense fallback={null}>
      <StudentDashboardView />
    </Suspense>
  );
}
