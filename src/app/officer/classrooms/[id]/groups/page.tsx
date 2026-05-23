import { notFound } from "next/navigation";
import { getManagedGroups } from "@/app/actions/groups";
import { GroupManagementView } from "@/components/officer/group-management-view";

export const metadata = { title: "Group Management" };

export default async function OfficerGroupsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getManagedGroups(id);

  if (!data) {
    notFound();
  }

  return (
    <GroupManagementView
      classroomId={id}
      classroomName={data.classroomName}
      inviteUrl={data.inviteUrl}
      groups={data.groups}
    />
  );
}
