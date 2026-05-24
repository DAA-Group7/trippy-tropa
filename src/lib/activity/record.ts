import { createLogger } from "@/lib/logger";
import type { createClient } from "@/lib/supabase/server";
import type { ClassroomActivityEventType } from "@/types/database";

const log = createLogger("activity");

export async function recordClassroomActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  event: {
    classroomId: string;
    actorId: string | null;
    eventType: ClassroomActivityEventType;
    payload?: Record<string, unknown>;
  }
): Promise<void> {
  const { error } = await supabase.from("classroom_activity_events").insert({
    classroom_id: event.classroomId,
    actor_id: event.actorId,
    event_type: event.eventType,
    payload: event.payload ?? {},
  });

  if (error) {
    log.warn("activity_record_failed", {
      classroomId: event.classroomId,
      eventType: event.eventType,
      message: error.message,
    });
  }
}
