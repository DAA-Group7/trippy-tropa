import { getOfficerDashboardData } from "@/app/actions/classrooms";
import { OfficerDashboardView } from "@/components/officer/officer-dashboard-view";

export const metadata = { title: "Dashboard" };

export default async function OfficerDashboardPage() {
  const data = await getOfficerDashboardData();

  return <OfficerDashboardView data={data} />;
}
