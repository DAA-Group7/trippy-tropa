import { getClassroomDetail } from "@/app/actions/classrooms";
import { ClassroomDetailView } from "@/components/officer/classroom-detail-view";

export const metadata = { title: "Classroom Detail" };

export default async function ClassroomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const classroom = await getClassroomDetail(id);

  return (
    <ClassroomDetailView classroom={classroom} classroomId={id} />
  );
}
