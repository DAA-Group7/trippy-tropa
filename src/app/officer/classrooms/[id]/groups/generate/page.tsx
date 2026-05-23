import { notFound } from "next/navigation";
import { getGroupGenerationContext } from "@/app/actions/groups";
import { GroupGenerationView } from "@/components/officer/group-generation-view";

export const metadata = { title: "Group Generation" };

export default async function GenerateGroupsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await getGroupGenerationContext(id);

  if (!context) {
    notFound();
  }

  return <GroupGenerationView context={context} />;
}
