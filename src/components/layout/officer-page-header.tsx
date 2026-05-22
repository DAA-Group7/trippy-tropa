"use client";

import { Bell, UserCircle } from "lucide-react";

export function OfficerPageHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#c3c6d7] bg-white px-4 md:px-6">
      <h2 className="text-lg font-bold text-[#004ac6] md:hidden">
        Smart Collaborative
      </h2>
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
