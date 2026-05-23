import { JoinClassroomView } from "@/components/join/join-classroom-view";
import { getClassroomByInviteCode } from "@/app/actions/join-classroom";
import { parseInviteCodeFromInput } from "@/lib/invite";

export const metadata = { title: "Join a Classroom" };

export default async function JoinClassroomPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code: rawCode } = await searchParams;
  const parsed = rawCode ? parseInviteCodeFromInput(rawCode) : null;
  const classroom = parsed ? await getClassroomByInviteCode(parsed) : null;

  return (
    <JoinClassroomView
      initialCode={parsed ?? rawCode}
      classroom={classroom}
    />
  );
}
