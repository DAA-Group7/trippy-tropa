import { Suspense } from "react";
import { StudentDashboardView } from "@/components/student/student-dashboard-view";
import { JoinSuccessToast } from "@/components/student/join-success-toast";

export const metadata = { title: "Dashboard" };

export default function StudentDashboardPage() {
  return (
    <>
      <Suspense fallback={null}>
        <JoinSuccessToast />
      </Suspense>
      <StudentDashboardView />
    </>
  );
}
