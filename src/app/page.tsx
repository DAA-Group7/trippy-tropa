import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  DoorOpen,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  Plus,
  Users,
  UsersRound,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BrandMark } from "@/components/brand/brand-mark";
import { APP_TAGLINE } from "@/lib/constants/brand";
import { routes } from "@/lib/constants/routes";

const LANDING_FEATURES: {
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Intelligent group formation",
    description:
      "Balance teams by skill so every group is ready to contribute from day one.",
    icon: UsersRound,
  },
  {
    title: "Skill-matched task assignment",
    description:
      "Assign work fairly with requirements that reflect each student’s strengths.",
    icon: ListChecks,
  },
  {
    title: "Real-time collaboration",
    description:
      "Chat, Kanban boards, and notifications keep groups aligned without extra apps.",
    icon: MessageSquare,
  },
  {
    title: "Classroom progress at a glance",
    description:
      "Officers monitor enrollment, groups, and task flow from one dashboard.",
    icon: BarChart3,
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#faf8ff] to-[#f3f3fe]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 sm:py-6">
        <BrandMark size="md" href={routes.home} showTagline={false} />
        <div className="flex gap-2">
          <ButtonLink href={routes.login} variant="ghost" size="sm">
            Log in
          </ButtonLink>
          <ButtonLink href={routes.register} size="sm">
            Get started
          </ButtonLink>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-12 sm:px-6 sm:pb-16">
        <section className="flex flex-col items-center pt-4 text-center sm:pt-10">
          <p className="rounded-full border border-[#004ac6]/20 bg-[#dbe1ff]/50 px-4 py-1 text-sm font-medium text-[#004ac6]">
            {APP_TAGLINE}
          </p>
          <h1 className="mt-4 max-w-3xl font-heading text-3xl font-bold tracking-tight text-[#191b23] sm:mt-6 sm:text-5xl">
            Intelligent groups. Smarter tasks. One workspace.
          </h1>
          <p className="mt-3 max-w-2xl text-base text-[#434655] sm:mt-4 sm:text-lg">
            Form skill-balanced teams, assign work fairly, and collaborate in
            real time—built for classrooms on desktop and mobile.
          </p>

          <div className="mt-6 flex w-full max-w-sm flex-col gap-3 sm:mt-8 sm:max-w-lg sm:flex-row sm:justify-center">
            <ButtonLink
              href={routes.join}
              className="h-11 w-full gap-2 px-6 text-base font-semibold sm:w-auto"
            >
              <DoorOpen className="size-5" aria-hidden />
              Join classroom
            </ButtonLink>
            <ButtonLink
              href={routes.officer.createClassroom}
              variant="outline"
              className="h-11 w-full gap-2 border-[#c3c6d7] bg-white px-6 text-base font-semibold text-[#004ac6] hover:bg-[#f3f3fe] sm:w-auto"
            >
              <Plus className="size-5" aria-hidden />
              Create classroom
            </ButtonLink>
          </div>
          <p className="mt-3 text-xs text-[#505f76] sm:text-sm">
            Students join with an invite link. Teachers sign in to set up a
            class.
          </p>
        </section>

        <section
          className="mt-12 w-full sm:mt-16"
          aria-labelledby="landing-features-heading"
        >
          <div className="text-center">
            <h2
              id="landing-features-heading"
              className="font-heading text-xl font-semibold text-[#191b23] sm:text-2xl"
            >
              Built for structured group work
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-[#434655] sm:text-base">
              From balanced teams to fair assignments and shared workspaces—
              everything instructors and students need in one place.
            </p>
          </div>
          <ul className="mt-8 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {LANDING_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <li key={feature.title}>
                  <article className="flex h-full flex-col rounded-xl border border-[#c3c6d7] bg-white p-5 text-left shadow-sm">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-[#dbe1ff] text-[#004ac6]">
                      <Icon className="size-5" aria-hidden />
                    </div>
                    <h3 className="mt-4 font-heading text-base font-semibold text-[#191b23]">
                      {feature.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-[#434655]">
                      {feature.description}
                    </p>
                  </article>
                </li>
              );
            })}
          </ul>
        </section>

        <section
          className="mt-10 grid w-full gap-4 sm:mt-14 sm:grid-cols-2"
          aria-label="Learn more by role"
        >
          <Card className="border-[#c3c6d7] text-left shadow-sm transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-[#dbe1ff] text-[#004ac6]">
                <LayoutDashboard className="size-5" aria-hidden />
              </div>
              <CardTitle className="font-heading text-[#191b23]">
                For instructors
              </CardTitle>
              <CardDescription className="text-[#434655]">
                Generate balanced groups, assign tasks with skill matching, and
                monitor class progress.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ButtonLink
                href={routes.officer.dashboard}
                variant="secondary"
                className="w-full"
              >
                Officer dashboard
              </ButtonLink>
            </CardContent>
          </Card>

          <Card className="border-[#c3c6d7] text-left shadow-sm transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-[#dbe1ff] text-[#004ac6]">
                <Users className="size-5" aria-hidden />
              </div>
              <CardTitle className="font-heading text-[#191b23]">
                For students
              </CardTitle>
              <CardDescription className="text-[#434655]">
                Complete a quick skills check, join your group, and track tasks
                on a shared board.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ButtonLink
                href={routes.student.dashboard}
                variant="secondary"
                className="w-full"
              >
                Student dashboard
              </ButtonLink>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
