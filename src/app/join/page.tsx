import { JoinClassroomView } from "@/components/join/join-classroom-view";

export const metadata = { title: "Join a Classroom" };

export default async function JoinClassroomPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  return <JoinClassroomView initialCode={code} />;
}
