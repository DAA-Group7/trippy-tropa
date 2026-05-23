"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  getNotifications,
  type NotificationItem,
} from "@/app/actions/notifications";
import { createClient } from "@/lib/supabase/client";
import { subscribeToPostgresChanges } from "@/lib/supabase/realtime";

export function useNotificationsRealtime(
  userId: string,
  initial: NotificationItem[]
) {
  const [items, setItems] = useState(initial);
  const instanceId = useId();
  const refreshRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    setItems(initial);
  }, [initial]);

  const refresh = useCallback(async () => {
    const next = await getNotifications();
    setItems(next);
  }, []);

  refreshRef.current = refresh;

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channelId = `notifications:${userId}:${instanceId.replace(/:/g, "")}`;

    return subscribeToPostgresChanges(supabase, {
      channelId,
      table: "notifications",
      filter: `user_id=eq.${userId}`,
      onEvent: () => {
        void refreshRef.current();
      },
    });
  }, [userId, instanceId]);

  const unreadCount = items.filter((n) => !n.read).length;

  return { items, unreadCount, refresh, setItems };
}
