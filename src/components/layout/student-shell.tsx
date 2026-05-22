"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  LayoutDashboard,
  ClipboardList,
  School,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { INSTITUTION_LOGO_URL } from "@/lib/constants/student-dashboard-demo";
import { routes } from "@/lib/constants/routes";

const navItems = [
  {
    href: routes.student.dashboard,
    label: "Dashboard",
    icon: LayoutDashboard,
    match: (path: string) => path === routes.student.dashboard,
  },
  {
    href: routes.join,
    label: "Classrooms",
    icon: School,
    match: (path: string) =>
      path === routes.join || path.startsWith("/join"),
  },
  {
    href: routes.student.dashboard,
    label: "Tasks",
    icon: ClipboardList,
    match: () => false,
  },
  {
    href: routes.student.dashboard,
    label: "Notifications",
    icon: Bell,
    match: () => false,
  },
];

function isNavActive(
  pathname: string,
  item: (typeof navItems)[number]
): boolean {
  if (item.match) return item.match(pathname);
  return pathname === item.href;
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex w-full flex-col px-2">
      {navItems.map((item) => {
        const active = isNavActive(pathname, item);
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-4 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200",
              active
                ? "border-r-4 border-[#004ac6] bg-[#f3f3fe] font-bold text-[#004ac6]"
                : "text-[#505f76] hover:bg-[#e7e7f3] hover:text-[#004ac6]"
            )}
          >
            <Icon className="size-5" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export function StudentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#faf8ff] text-[#191b23]">
      <aside className="fixed left-0 z-40 hidden h-full w-64 flex-col border-r border-[#c3c6d7] bg-white py-6 md:flex">
        <div className="mb-10 flex items-center gap-4 px-4">
          <Image
            src={INSTITUTION_LOGO_URL}
            alt=""
            width={40}
            height={40}
            className="size-10 rounded-full object-cover"
            unoptimized
          />
          <div>
            <h1 className="text-lg font-semibold leading-tight text-[#004ac6]">
              Management System
            </h1>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#434655]">
              Academic Portal
            </p>
          </div>
        </div>
        <NavLinks pathname={pathname} />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col md:ml-64">
        <div className="flex flex-1 flex-col pb-20 md:pb-0">{children}</div>

        <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-[#c3c6d7] bg-white/90 px-4 py-2 backdrop-blur-md md:hidden">
          {navItems.map((item) => {
            const active = isNavActive(pathname, item);
            const Icon = item.icon;
            const short =
              item.label === "Dashboard"
                ? "Home"
                : item.label === "Classrooms"
                  ? "Classes"
                  : item.label === "Notifications"
                    ? "Updates"
                    : item.label;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-xs font-semibold transition-transform active:scale-95",
                  active
                    ? "bg-[#d0e1fb] text-[#54647a]"
                    : "text-[#434655]"
                )}
              >
                <Icon className="size-5" />
                {short}
                {item.label === "Notifications" && (
                  <span className="absolute right-2 top-1 size-2 rounded-full bg-[#ba1a1a]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
