import { getClassroomDetail } from "@/app/actions/classrooms";
import { GroupManagementView } from "@/components/officer/group-management-view";

export const metadata = { title: "Group Management" };

export default async function OfficerGroupsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const classroom = await getClassroomDetail(id);

  return (
    <GroupManagementView
      classroomId={id}
      classroomName={classroom?.name ?? "Your classroom"}
      inviteUrl={classroom?.inviteUrl ?? null}
    />
  );
}
