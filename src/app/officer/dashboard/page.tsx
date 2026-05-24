import { getOfficerActivityFeed } from "@/app/actions/activity";
import { getOfficerDashboardData } from "@/app/actions/classrooms";
import { getNotifications } from "@/app/actions/notifications";
import { OfficerDashboardView } from "@/components/officer/officer-dashboard-view";
import { getSessionUser } from "@/lib/auth/session";

export const metadata = { title: "Dashboard" };

export default async function OfficerDashboardPage() {
  const [data, { user }, activity] = await Promise.all([
    getOfficerDashboardData(),
    getSessionUser(),
    getOfficerActivityFeed(),
  ]);
  const notifications = user ? await getNotifications() : [];

  return (
    <OfficerDashboardView
      data={data}
      userId={user?.id ?? ""}
      initialNotifications={notifications}
      activity={activity}
    />
  );
}
