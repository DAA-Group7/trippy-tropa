"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserCircle } from "lucide-react";
import { BrandTitle } from "@/components/brand/brand-mark";
import { JoinClassroomForm } from "@/components/join/join-classroom-form";
import { routes } from "@/lib/constants/routes";

interface JoinClassroomViewProps {
  initialCode?: string;
}

export function JoinClassroomView({ initialCode }: JoinClassroomViewProps) {
  const router = useRouter();

  const loginHref = initialCode
    ? `${routes.login}?code=${encodeURIComponent(initialCode)}`
    : routes.login;

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8ff] text-[#191b23]">
      <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-[#c3c6d7] bg-white px-4 md:px-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full p-2 text-[#434655] transition-colors hover:bg-[#e7e7f3]"
            aria-label="Go back"
          >
            <ArrowLeft className="size-5" />
          </button>
          <BrandTitle className="text-lg" />
        </div>
        <Link
          href={loginHref}
          className="rounded-full p-2 text-[#434655] transition-colors hover:bg-[#e7e7f3]"
          aria-label="Account"
        >
          <UserCircle className="size-6" />
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center p-4 md:p-6">
        <JoinClassroomForm initialCode={initialCode} />
      </main>
    </div>
  );
}
