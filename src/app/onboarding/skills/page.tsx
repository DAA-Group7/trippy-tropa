import { SkillAssessmentView } from "@/components/onboarding/skill-assessment-view";

export const metadata = { title: "Skill Assessment" };

export default async function SkillOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  return <SkillAssessmentView inviteCode={code} />;
}
