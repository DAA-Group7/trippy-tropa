import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  SupabaseClient,
} from "@supabase/supabase-js";

type PostgresEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

/**
 * Subscribe to Supabase Realtime (WebSocket to Supabase — no extra Vercel infra).
 * Returns cleanup. Registers listeners before subscribe() to avoid client errors.
 */
export function subscribeToPostgresChanges(
  supabase: SupabaseClient,
  options: {
    channelId: string;
    table: string;
    filter?: string;
    event?: PostgresEvent;
    onEvent: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
  }
): () => void {
  const channel: RealtimeChannel = supabase.channel(options.channelId);

  channel.on(
    "postgres_changes",
    {
      event: options.event ?? "*",
      schema: "public",
      table: options.table,
      filter: options.filter,
    },
    options.onEvent
  );

  channel.subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
