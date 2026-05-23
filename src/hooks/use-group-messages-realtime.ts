"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getGroupMessages,
  type GroupMessageItem,
} from "@/app/actions/messages";
import { createClient } from "@/lib/supabase/client";

export function useGroupMessagesRealtime(
  groupId: string,
  initial: GroupMessageItem[]
) {
  const [messages, setMessages] = useState(initial);

  useEffect(() => {
    setMessages(initial);
  }, [initial]);

  const refresh = useCallback(async () => {
    const next = await getGroupMessages(groupId);
    setMessages(next);
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`group_messages:${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages",
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          void refresh();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [groupId, refresh]);

  return { messages, setMessages, refresh };
}
