"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getNotifications,
  type NotificationItem,
} from "@/app/actions/notifications";
import { createClient } from "@/lib/supabase/client";

export function useNotificationsRealtime(
  userId: string,
  initial: NotificationItem[]
) {
  const [items, setItems] = useState(initial);

  useEffect(() => {
    setItems(initial);
  }, [initial]);

  const refresh = useCallback(async () => {
    const next = await getNotifications();
    setItems(next);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void refresh();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  const unreadCount = items.filter((n) => !n.read).length;

  return { items, unreadCount, refresh, setItems };
}
