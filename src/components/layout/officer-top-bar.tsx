"use client";

import { Bell, Search } from "lucide-react";

interface OfficerTopBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
}

export function OfficerTopBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search classrooms, students...",
}: OfficerTopBarProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-[#c3c6d7] bg-white px-4 md:px-6">
      <div className="flex w-full max-w-md items-center gap-2 rounded-lg border border-[#c3c6d7] bg-[#f3f3fe] px-3 py-2 transition-colors focus-within:border-[#004ac6]">
        <Search className="size-5 shrink-0 text-[#737686]" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full border-0 bg-transparent text-sm text-[#191b23] placeholder:text-[#737686] focus:outline-none focus:ring-0"
        />
      </div>
      <button
        type="button"
        className="rounded-full p-2 text-[#434655] transition-colors hover:bg-[#e7e7f3] active:opacity-80"
        aria-label="Notifications"
      >
        <Bell className="size-5" />
      </button>
    </header>
  );
}
