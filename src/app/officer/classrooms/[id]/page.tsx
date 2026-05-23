import { notFound } from "next/navigation";
import { getClassroomDetailFull } from "@/app/actions/classrooms";
import { ClassroomDetailView } from "@/components/officer/classroom-detail-view";

export const metadata = { title: "Classroom Detail" };

export default async function ClassroomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const classroom = await getClassroomDetailFull(id);

  if (!classroom) {
    notFound();
  }

  return (
    <ClassroomDetailView classroom={classroom} classroomId={id} />
  );
}
