"use server";

import { z } from "zod";
import { formatTimeAgo } from "@/lib/notifications/helpers";
import { createClient } from "@/lib/supabase/server";

const sendMessageSchema = z.object({
  groupId: z.string().uuid(),
  body: z.string().trim().min(1).max(2000),
});

export type GroupMessageItem = {
  id: string;
  body: string;
  createdAt: string;
  timeAgo: string;
  authorId: string;
  authorName: string;
  authorInitials: string;
  isOwn: boolean;
};

function displayName(fullName: string | null, email: string): string {
  if (fullName?.trim()) return fullName.trim();
  return email.split("@")[0] ?? "Member";
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return (name.slice(0, 2) || "??").toUpperCase();
}

async function assertGroupMember(
  supabase: Awaited<ReturnType<typeof createClient>>,
  groupId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  return !!data;
}

export async function getGroupMessages(
  groupId: string,
  limit = 50
): Promise<GroupMessageItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const isMember = await assertGroupMember(supabase, groupId, user.id);
  if (!isMember) {
    const { data: group } = await supabase
      .from("groups")
      .select("classroom_id")
      .eq("id", groupId)
      .maybeSingle();

    if (!group) return [];

    const { data: classroom } = await supabase
      .from("classrooms")
      .select("created_by")
      .eq("id", group.classroom_id)
      .maybeSingle();

    if (classroom?.created_by !== user.id) return [];
  }

  const { data: rows } = await supabase
    .from("group_messages")
    .select("id, body, created_at, user_id")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (!rows?.length) return [];

  const authorIds = [...new Set(rows.map((r) => r.user_id as string))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", authorIds);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return rows.map((row) => {
    const profile = profileById.get(row.user_id as string);
    const name = profile
      ? displayName(profile.full_name, profile.email)
      : "Member";
    return {
      id: row.id,
      body: row.body,
      createdAt: row.created_at,
      timeAgo: formatTimeAgo(row.created_at),
      authorId: row.user_id as string,
      authorName: name,
      authorInitials: initialsFromName(name),
      isOwn: row.user_id === user.id,
    };
  });
}

export async function sendGroupMessage(
  input: z.infer<typeof sendMessageSchema>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Message must be between 1 and 2000 characters." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const isMember = await assertGroupMember(
    supabase,
    parsed.data.groupId,
    user.id
  );
  if (!isMember) {
    return { ok: false, error: "You must be in this group to post messages." };
  }

  const { error } = await supabase.from("group_messages").insert({
    group_id: parsed.data.groupId,
    user_id: user.id,
    body: parsed.data.body,
  });

  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
