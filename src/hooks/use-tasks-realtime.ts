"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useTasksRealtime(
  groupId: string | null,
  onChange: () => void
) {
  useEffect(() => {
    if (!groupId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`tasks:${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          onChange();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [groupId, onChange]);
}
