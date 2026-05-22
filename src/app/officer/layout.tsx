import { OfficerShell } from "@/components/layout/officer-shell";
import { requireRole } from "@/lib/auth/require-role";

export default async function OfficerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["officer"]);

  return <OfficerShell>{children}</OfficerShell>;
}
