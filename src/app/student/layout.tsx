import { SkipToContent } from "@/components/a11y/skip-to-content";
import { StudentShell } from "@/components/layout/student-shell";
import { requireRole } from "@/lib/auth/require-role";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["student"]);

  return (
    <>
      <SkipToContent />
      <StudentShell>{children}</StudentShell>
    </>
  );
}
