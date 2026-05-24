import { redirect } from "next/navigation";
import {
  decideInviteLanding,
  loginWithInvite,
  onboardingWithCode,
} from "@/lib/auth/join-flow";
import { getSessionUser } from "@/lib/auth/session";
import { memberNeedsClassroomAssessment } from "@/app/actions/classroom-skills";
import {
  enrollInClassroom,
  getClassroomByInviteCode,
} from "@/app/actions/join-classroom";
import { JoinClassroomView } from "@/components/join/join-classroom-view";
import { JoinInviteNotFound } from "@/components/join/join-invite-not-found";
import { routes } from "@/lib/constants/routes";
import { createLogger } from "@/lib/logger";

const log = createLogger("join:page");

export const metadata = { title: "Join a Classroom" };

export default async function JoinByCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const classroom = await getClassroomByInviteCode(code);

  if (!classroom) {
    log.warn("invite_not_found", { code });
    return <JoinInviteNotFound code={code} />;
  }

  const { user, profile } = await getSessionUser();
  const decision = decideInviteLanding(code, user, profile, true);

  log.info("invite_landing", {
    code,
    decision: decision.type,
    authenticated: Boolean(user),
    role: profile?.role,
  });

  switch (decision.type) {
    case "auth_required":
      redirect(loginWithInvite(code));
    case "forbidden":
      redirect(
        profile?.role === "officer"
          ? routes.officer.dashboard
          : routes.home
      );
    case "onboarding":
      redirect(onboardingWithCode(code));
    case "ready_to_enroll": {
      const result = await enrollInClassroom(code);
      if (!result.ok) {
        return (
          <JoinClassroomView
            initialCode={code}
            classroom={classroom}
            error={result.error}
          />
        );
      }
      if (
        user &&
        (await memberNeedsClassroomAssessment(result.classroomId, user.id))
      ) {
        redirect(onboardingWithCode(code));
      }
      const joined = result.alreadyMember ? "already" : "new";
      redirect(
        `${routes.student.dashboard}?joined=${joined}&classroom=${encodeURIComponent(result.classroomName)}`
      );
    }
  }
}
