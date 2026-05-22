"use server";

import { createClient } from "@/lib/supabase/server";

export type ClassroomPreview = {
  id: string;
  name: string;
  subject: string | null;
  inviteCode: string;
};

export async function getClassroomByInviteCode(
  code: string
): Promise<ClassroomPreview | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("classrooms")
    .select("id, name, subject, invite_code")
    .eq("invite_code", code)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    subject: data.subject,
    inviteCode: data.invite_code,
  };
}
