import { SkillAssessmentView } from "@/components/onboarding/skill-assessment-view";
import {
  getOnboardingSkillContext,
  memberNeedsClassroomAssessment,
} from "@/app/actions/classroom-skills";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { routes } from "@/lib/constants/routes";

export const metadata = { title: "Skill Assessment" };

export default async function SkillOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { profile } = await requireRole(["student"]);
  const { code } = await searchParams;
  const onboardingContext = await getOnboardingSkillContext(code);

  if (
    profile.skills_completed &&
    !onboardingContext.usesClassroomTemplates
  ) {
    redirect(routes.student.dashboard);
  }

  if (
    profile.skills_completed &&
    onboardingContext.classroomId &&
    onboardingContext.usesClassroomTemplates
  ) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const needsAssessment = await memberNeedsClassroomAssessment(
        onboardingContext.classroomId,
        user.id
      );
      if (!needsAssessment) {
        redirect(routes.student.dashboard);
      }
    }
  }

  return (
    <SkillAssessmentView
      inviteCode={code}
      onboardingContext={onboardingContext}
    />
  );
}
