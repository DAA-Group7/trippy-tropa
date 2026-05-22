import { JoinClassroomForm } from "@/components/join/join-classroom-form";

export const metadata = { title: "Join classroom" };

export default async function JoinClassroomPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  return (
    <div className="min-h-screen bg-[#faf8ff] px-4 py-12">
      <JoinClassroomForm initialCode={code} />
    </div>
  );
}
