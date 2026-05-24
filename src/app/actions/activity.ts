"use server";

import {
  displayActorName,
  formatActivitySummary,
  iconForActivityType,
  type ActivityFeedIcon,
} from "@/lib/activity/helpers";
import { formatTimeAgo } from "@/lib/notifications/helpers";
import { createClient } from "@/lib/supabase/server";
import type { ClassroomActivityEventType } from "@/types/database";

export type ClassroomActivityItem = {
  id: string;
  eventType: ClassroomActivityEventType;
  icon: ActivityFeedIcon;
  classroomId: string;
  classroomName: string;
  summary: string;
  createdAt: string;
  timeAgo: string;
};

const ACTIVITY_FEED_LIMIT = 20;

export async function getOfficerActivityFeed(): Promise<ClassroomActivityItem[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("classroom_activity_events")
    .select(
      `
      id,
      event_type,
      payload,
      created_at,
      classroom_id,
      classrooms ( name ),
      profiles ( full_name, email )
    `
    )
    .order("created_at", { ascending: false })
    .limit(ACTIVITY_FEED_LIMIT);

  if (error || !data) {
    return [];
  }

  return data.map((row) => {
    const payload = (row.payload ?? {}) as Record<string, unknown>;
    const classroom = row.classrooms as { name: string } | null;
    const profile = row.profiles as {
      full_name: string | null;
      email: string;
    } | null;
    const eventType = row.event_type as ClassroomActivityEventType;
    const actorName = profile
      ? displayActorName(profile.full_name, profile.email)
      : null;

    return {
      id: row.id,
      eventType,
      icon: iconForActivityType(eventType),
      classroomId: row.classroom_id,
      classroomName: classroom?.name ?? "Classroom",
      summary: formatActivitySummary(eventType, payload, actorName),
      createdAt: row.created_at,
      timeAgo: formatTimeAgo(row.created_at),
    };
  });
}
