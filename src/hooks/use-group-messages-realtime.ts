"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  getGroupMessages,
  type GroupMessageItem,
} from "@/app/actions/messages";
import { createClient } from "@/lib/supabase/client";
import { subscribeToPostgresChanges } from "@/lib/supabase/realtime";

export function useGroupMessagesRealtime(
  groupId: string,
  initial: GroupMessageItem[]
) {
  const [messages, setMessages] = useState(initial);
  const instanceId = useId();
  const refreshRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    setMessages(initial);
  }, [initial]);

  const refresh = useCallback(async () => {
    const next = await getGroupMessages(groupId);
    setMessages(next);
  }, [groupId]);

  refreshRef.current = refresh;

  useEffect(() => {
    if (!groupId) return;

    const supabase = createClient();
    const channelId = `group_messages:${groupId}:${instanceId.replace(/:/g, "")}`;

    return subscribeToPostgresChanges(supabase, {
      channelId,
      table: "group_messages",
      filter: `group_id=eq.${groupId}`,
      event: "INSERT",
      onEvent: () => {
        void refreshRef.current();
      },
    });
  }, [groupId, instanceId]);

  return { messages, setMessages, refresh };
}
