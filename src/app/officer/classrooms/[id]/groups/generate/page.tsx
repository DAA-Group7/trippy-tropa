import { getClassroomBrief } from "@/app/actions/classrooms";
import { GroupGenerationView } from "@/components/officer/group-generation-view";

export const metadata = { title: "Group Generation" };

export default async function GenerateGroupsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const classroom = await getClassroomBrief(id);

  return (
    <GroupGenerationView
      classroomName={classroom?.name ?? "Your classroom"}
      inviteUrl={classroom?.inviteUrl ?? null}
    />
  );
}
