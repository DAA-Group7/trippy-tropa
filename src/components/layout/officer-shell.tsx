"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  LayoutDashboard,
  ClipboardList,
  Menu,
  School,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand/brand-mark";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { OFFICER_AVATAR_URL } from "@/lib/constants/classroom-images";
import { routes } from "@/lib/constants/routes";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  {
    href: routes.officer.dashboard,
    label: "Dashboard",
    icon: LayoutDashboard,
    match: (path: string) =>
      path === routes.officer.dashboard ||
      path === "/officer/dashboard/",
  },
  {
    href: routes.officer.createClassroom,
    label: "Classrooms",
    icon: School,
    match: (path: string) => path.includes("/officer/classrooms"),
  },
  {
    href: routes.officer.dashboard,
    label: "Tasks",
    icon: ClipboardList,
    match: () => false,
  },
  {
    href: routes.officer.dashboard,
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
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex w-full flex-col gap-1 px-2">
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
            <Icon className={cn("size-5", active && "fill-current")} />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

function OfficerProfile() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#c3c6d7] p-2">
      <Image
        src={OFFICER_AVATAR_URL}
        alt="Dr. Smith"
        width={40}
        height={40}
        className="size-10 rounded-full object-cover"
        unoptimized
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[#191b23]">Dr. Smith</p>
        <p className="text-xs text-[#434655]">Admin Officer</p>
      </div>
    </div>
  );
}

export function OfficerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname === routes.officer.dashboard;

  return (
    <div className="flex min-h-screen bg-[#faf8ff] text-[#191b23]">
      <aside className="fixed left-0 z-20 hidden h-full w-64 flex-col border-r border-[#c3c6d7] bg-white py-6 md:flex">
        <div className="mb-8 px-4">
          <BrandMark size="md" href={routes.officer.dashboard} showTagline />
        </div>
        <div className="flex-1">
          <NavLinks pathname={pathname} />
        </div>
        <div className="mt-auto space-y-3 px-4 pb-4">
          <OfficerProfile />
          <SignOutButton />
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col md:ml-64">
        {!isDashboard && (
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#c3c6d7] bg-white px-4 md:hidden">
            <BrandMark size="sm" showTagline={false} />
            <Sheet>
              <SheetTrigger
                render={
                  <Button variant="outline" size="icon" aria-label="Open menu">
                    <Menu className="size-4" />
                  </Button>
                }
              />
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="border-b px-4 py-4 text-left">
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  <NavLinks pathname={pathname} />
                </div>
                <div className="space-y-3 border-t px-4 py-4">
                  <OfficerProfile />
                  <SignOutButton />
                </div>
              </SheetContent>
            </Sheet>
          </header>
        )}

        <div className="flex flex-1 flex-col pb-20 md:pb-0">{children}</div>

        <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-[#c3c6d7] bg-white/90 px-4 py-2 backdrop-blur-md md:hidden">
          {navItems.map((item) => {
            const active = isNavActive(pathname, item);
            const Icon = item.icon;
            const shortLabel =
              item.label === "Classrooms"
                ? "Classes"
                : item.label === "Dashboard"
                  ? "Home"
                  : item.label === "Notifications"
                    ? "Updates"
                    : item.label;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-xs font-semibold transition-transform active:scale-95",
                  active
                    ? "bg-[#d0e1fb] text-[#54647a]"
                    : "text-[#434655]"
                )}
              >
                <Icon className="size-5" />
                {shortLabel}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
