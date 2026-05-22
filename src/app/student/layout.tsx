import { AppShell } from "@/components/layout/app-shell";
import { routes } from "@/lib/constants/routes";

const studentNav = [
  { href: routes.student.dashboard, label: "Dashboard" },
  { href: routes.join, label: "Join classroom" },
];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell navItems={studentNav} roleLabel="Student">
      {children}
    </AppShell>
  );
}
