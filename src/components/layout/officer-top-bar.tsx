"use client";

import { Search } from "lucide-react";
import type { NotificationItem } from "@/app/actions/notifications";
import { NotificationsBell } from "@/components/notifications/notifications-bell";

interface OfficerTopBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  notificationItems?: NotificationItem[];
  onNotificationItemsChange?: (items: NotificationItem[]) => void;
}

export function OfficerTopBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search classrooms, students...",
  notificationItems,
  onNotificationItemsChange,
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
          aria-label={searchPlaceholder}
          className="w-full border-0 bg-transparent text-sm text-stitch-text placeholder:text-stitch-text-nav focus:outline-none focus:ring-0"
        />
      </div>
      {notificationItems && onNotificationItemsChange ? (
        <NotificationsBell
          items={notificationItems}
          onItemsChange={onNotificationItemsChange}
        />
      ) : null}
    </header>
  );
}
