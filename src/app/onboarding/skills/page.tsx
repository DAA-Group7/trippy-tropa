import { SkillAssessmentView } from "@/components/onboarding/skill-assessment-view";
import { requireRole } from "@/lib/auth/require-role";
import { redirect } from "next/navigation";
import { routes } from "@/lib/constants/routes";

export const metadata = { title: "Skill Assessment" };

export default async function SkillOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { profile } = await requireRole(["student"]);

  if (profile.skills_completed) {
    redirect(routes.student.dashboard);
  }

  const { code } = await searchParams;

  return <SkillAssessmentView inviteCode={code} />;
}
