"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import type { NotificationItem } from "@/app/actions/notifications";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { cn } from "@/lib/utils";

interface NotificationsBellProps {
  items: NotificationItem[];
  onItemsChange: (items: NotificationItem[]) => void;
  className?: string;
  iconClassName?: string;
}

export function NotificationsBell({
  items,
  onItemsChange,
  className,
  iconClassName = "text-[#434655]",
}: NotificationsBellProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const unreadCount = items.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div ref={panelRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 transition-colors hover:bg-[#e7e7f3] active:opacity-80"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={open}
      >
        <Bell className={cn("size-5", iconClassName)} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex min-w-[18px] items-center justify-center rounded-full bg-[#ba1a1a] px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-[#c3c6d7] bg-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.08)]"
          role="dialog"
          aria-label="Notifications"
        >
          <div className="border-b border-[#c3c6d7] px-4 py-3">
            <h2 className="text-sm font-semibold text-[#191b23]">
              Notifications
            </h2>
          </div>
          <NotificationsList
            items={items}
            onItemsChange={onItemsChange}
            compact
            emptyMessage="You're all caught up."
          />
        </div>
      )}
    </div>
  );
}
