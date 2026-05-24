import { notFound } from "next/navigation";
import { getClassroomSkillTemplatesForOfficer } from "@/app/actions/classroom-skills";
import { getClassroomDetailFull } from "@/app/actions/classrooms";
import { getClassroomParticipation } from "@/app/actions/participation";
import { ClassroomDetailView } from "@/components/officer/classroom-detail-view";

export const metadata = { title: "Classroom Detail" };

export default async function ClassroomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [classroom, participation, skillTemplates] = await Promise.all([
    getClassroomDetailFull(id),
    getClassroomParticipation(id),
    getClassroomSkillTemplatesForOfficer(id),
  ]);

  if (!classroom) {
    notFound();
  }

  return (
    <ClassroomDetailView
      classroom={classroom}
      classroomId={id}
      participation={participation}
      skillTemplates={skillTemplates ?? []}
    />
  );
}
