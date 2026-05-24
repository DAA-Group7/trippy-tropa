import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AutoAssignHelpGuide } from "@/components/officer/auto-assign-help-guide";
import { OfficerPageHeader } from "@/components/layout/officer-page-header";
import { requireRole } from "@/lib/auth/require-role";
import { routes } from "@/lib/constants/routes";

export const metadata = {
  title: "How auto-assign works",
  description:
    "Plain-language guide to Trippy-Tropa task auto-assignment for instructors.",
};

export default async function AutoAssignDocsPage() {
  await requireRole(["officer"]);

  return (
    <>
      <OfficerPageHeader />
      <div className="mx-auto w-full max-w-[800px] flex-1 space-y-6 p-4 md:p-8">
        <Link
          href={routes.officer.dashboard}
          className="inline-flex items-center gap-1 text-sm font-medium text-[#434655] hover:text-[#004ac6]"
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>
        <AutoAssignHelpGuide />
        <p className="text-center text-xs text-[#737686]">
          Technical reference:{" "}
          <code className="rounded bg-[#f3f3fe] px-1.5 py-0.5">
            docs/algorithms/greedy-assignment.md
          </code>
        </p>
      </div>
    </>
  );
}
