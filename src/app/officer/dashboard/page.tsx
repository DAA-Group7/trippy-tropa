import { getOfficerDashboardData } from "@/app/actions/classrooms";
import { getNotifications } from "@/app/actions/notifications";
import { OfficerDashboardView } from "@/components/officer/officer-dashboard-view";
import { getSessionUser } from "@/lib/auth/session";

export const metadata = { title: "Dashboard" };

export default async function OfficerDashboardPage() {
  const [data, { user }] = await Promise.all([
    getOfficerDashboardData(),
    getSessionUser(),
  ]);
  const notifications = user ? await getNotifications() : [];

  return (
    <OfficerDashboardView
      data={data}
      userId={user?.id ?? ""}
      initialNotifications={notifications}
    />
  );
}
