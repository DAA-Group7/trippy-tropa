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

function OfficerProfile({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-stitch-border p-2">
      <Image
        src={OFFICER_AVATAR_URL}
        alt=""
        width={40}
        height={40}
        className="size-10 rounded-full object-cover"
        unoptimized
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-stitch-text">{name}</p>
        <p className="truncate text-xs text-stitch-text-secondary">{email}</p>
      </div>
    </div>
  );
}

export function OfficerShell({
  children,
  officerName,
  officerEmail,
}: {
  children: React.ReactNode;
  officerName: string;
  officerEmail: string;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-stitch-canvas text-stitch-text">
      <aside className="fixed left-0 z-20 hidden h-full w-64 flex-col border-r border-stitch-border bg-stitch-surface py-6 md:flex">
        <div className="mb-8 px-4">
          <BrandMark size="md" href={routes.officer.dashboard} showTagline />
        </div>
        <div className="flex-1">
          <NavLinks pathname={pathname} />
        </div>
        <div className="mt-auto space-y-3 px-4 pb-4">
          <OfficerProfile name={officerName} email={officerEmail} />
          <SignOutButton />
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col md:ml-64">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-stitch-border bg-stitch-surface px-4 md:hidden">
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
                  <OfficerProfile name={officerName} email={officerEmail} />
                  <SignOutButton />
                </div>
              </SheetContent>
            </Sheet>
        </header>

        <main
          id="main-content"
          className="flex flex-1 flex-col pb-20 md:pb-0"
          tabIndex={-1}
        >
          {children}
        </main>

        <nav
          className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-stitch-border bg-stitch-surface/90 px-4 py-2 backdrop-blur-md md:hidden"
          aria-label="Mobile navigation"
        >
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
                    ? "bg-stitch-accent-muted text-stitch-nav-active"
                    : "text-stitch-text-secondary"
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
