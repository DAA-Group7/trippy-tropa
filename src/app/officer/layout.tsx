import { SkipToContent } from "@/components/a11y/skip-to-content";
import { OfficerShell } from "@/components/layout/officer-shell";
import { requireRole } from "@/lib/auth/require-role";
import { getSessionUser } from "@/lib/auth/session";

export default async function OfficerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["officer"]);
  const { profile } = await getSessionUser();

  return (
    <>
      <SkipToContent />
      <OfficerShell
        officerName={profile?.full_name ?? "Officer"}
        officerEmail={profile?.email ?? ""}
      >
        {children}
      </OfficerShell>
    </>
  );
}
