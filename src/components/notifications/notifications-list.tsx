"use client";

import {
  AlertTriangle,
  CheckSquare,
  MessageSquare,
  Users,
} from "lucide-react";
import {
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/app/actions/notifications";
import type { NotificationIcon } from "@/lib/notifications/helpers";
import { cn } from "@/lib/utils";

function KindIcon({ type }: { type: NotificationIcon }) {
  const config = {
    group: {
      icon: Users,
      bg: "bg-[#dbe1ff]",
      text: "text-[#004ac6]",
    },
    warning: {
      icon: AlertTriangle,
      bg: "bg-[#ffdad6]",
      text: "text-[#ba1a1a]",
    },
    forum: {
      icon: MessageSquare,
      bg: "bg-[#d3e4fe]",
      text: "text-[#505f76]",
    },
    task: {
      icon: CheckSquare,
      bg: "bg-[#d0e1fb]",
      text: "text-[#004ac6]",
    },
  }[type];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full p-1.5",
        config.bg,
        config.text
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}

interface NotificationsListProps {
  items: NotificationItem[];
  onItemsChange: (items: NotificationItem[]) => void;
  compact?: boolean;
  emptyMessage?: string;
}

export function NotificationsList({
  items,
  onItemsChange,
  compact = false,
  emptyMessage = "No notifications yet.",
}: NotificationsListProps) {
  const handleMarkRead = async (id: string) => {
    const result = await markNotificationRead(id);
    if (result.ok) {
      onItemsChange(
        items.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    }
  };

  const handleMarkAll = async () => {
    const result = await markAllNotificationsRead();
    if (result.ok) {
      onItemsChange(items.map((n) => ({ ...n, read: true })));
    }
  };

  if (items.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-[#505f76]">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      <ul className={cn(compact ? "max-h-72 overflow-y-auto" : "")}>
        {items.map((item, i) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => {
                if (!item.read) void handleMarkRead(item.id);
              }}
              className={cn(
                "flex w-full gap-3 border-b border-[#c3c6d7] p-4 text-left transition-colors hover:bg-[#f3f3fe]",
                !item.read && "bg-[#f3f3fe]",
                i === items.length - 1 && compact && "border-b-0"
              )}
            >
              <KindIcon type={item.icon} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#191b23]">
                  {item.title}
                </p>
                {item.body && (
                  <p className="mt-0.5 text-sm text-[#434655]">{item.body}</p>
                )}
                <span className="mt-1 block text-xs text-[#434655]">
                  {item.timeAgo}
                </span>
              </div>
              {!item.read && (
                <span
                  className="mt-1 size-2 shrink-0 rounded-full bg-[#004ac6]"
                  aria-hidden
                />
              )}
            </button>
          </li>
        ))}
      </ul>
      {items.some((n) => !n.read) && (
        <div className="border-t border-[#c3c6d7] bg-[#e7e7f3] p-3 text-center">
          <button
            type="button"
            onClick={() => void handleMarkAll()}
            className="text-xs font-semibold uppercase tracking-wide text-[#004ac6] hover:underline"
          >
            Mark all as read
          </button>
        </div>
      )}
    </div>
  );
}
