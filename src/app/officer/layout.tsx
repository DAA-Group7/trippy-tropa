import { OfficerShell } from "@/components/layout/officer-shell";

export default function OfficerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OfficerShell>{children}</OfficerShell>;
}
