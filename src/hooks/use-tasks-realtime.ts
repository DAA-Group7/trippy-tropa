"use client";

import { useEffect, useId, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { subscribeToPostgresChanges } from "@/lib/supabase/realtime";

export function useTasksRealtime(
  groupId: string | null,
  onChange: () => void
) {
  const instanceId = useId();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!groupId) return;

    const supabase = createClient();
    const channelId = `tasks:${groupId}:${instanceId.replace(/:/g, "")}`;

    return subscribeToPostgresChanges(supabase, {
      channelId,
      table: "tasks",
      filter: `group_id=eq.${groupId}`,
      onEvent: () => {
        onChangeRef.current();
      },
    });
  }, [groupId, instanceId]);
}
