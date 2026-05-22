"use client";

import { Bell, UserCircle } from "lucide-react";
import { BrandTitle } from "@/components/brand/brand-mark";

export function OfficerPageHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#c3c6d7] bg-white px-4 md:px-6">
      <BrandTitle className="text-lg md:hidden" />
      <div className="hidden md:block" />
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="rounded-full p-2 text-[#434655] transition-colors hover:bg-[#e7e7f3] active:opacity-80"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
        </button>
        <button
          type="button"
          className="rounded-full p-2 text-[#434655] transition-colors hover:bg-[#e7e7f3] active:opacity-80"
          aria-label="Account"
        >
          <UserCircle className="size-5" />
        </button>
      </div>
    </header>
  );
}
