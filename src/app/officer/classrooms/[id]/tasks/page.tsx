import { notFound } from "next/navigation";
import { getOfficerTasksContext } from "@/app/actions/tasks";
import { OfficerTasksView } from "@/components/officer/officer-tasks-view";

export const metadata = { title: "Task management" };

export default async function OfficerTasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await getOfficerTasksContext(id);

  if (!context) {
    notFound();
  }

  return <OfficerTasksView context={context} />;
}
