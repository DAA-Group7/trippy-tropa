"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { buildJoinUrl, generateInviteCode } from "@/lib/invite";
import { routes } from "@/lib/constants/routes";

const createClassroomSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  subject: z.string().optional(),
  maxGroups: z.coerce.number().int().min(1).max(20),
  rules: z.string().optional(),
});

export type CreateClassroomResult =
  | {
      success: true;
      classroomId: string;
      inviteCode: string;
      inviteUrl: string;
    }
  | { success: false; error: string };

export type DashboardClassroom = {
  id: string;
  name: string;
  subject: string | null;
  inviteCode: string;
  inviteUrl: string;
  memberCount: number;
};

export type OfficerDashboardData = {
  officerName: string;
  classrooms: DashboardClassroom[];
  stats: {
    totalStudents: number;
    groupsCreated: number;
    activeTasks: number;
    tasksNeedingReview: number;
  };
};

export type ClassroomBrief = {
  id: string;
  name: string;
  inviteCode: string;
  inviteUrl: string;
};

export type ClassroomDetail = ClassroomBrief & {
  subject: string | null;
  enrolledCount: number;
};

export async function getClassroomBrief(
  id: string
): Promise<ClassroomBrief | null> {
  const detail = await getClassroomDetail(id);
  if (!detail) return null;
  return {
    id: detail.id,
    name: detail.name,
    inviteCode: detail.inviteCode,
    inviteUrl: detail.inviteUrl,
  };
}

export async function getClassroomDetail(
  id: string
): Promise<ClassroomDetail | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("classrooms")
      .select("id, name, subject, invite_code")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;

    const { count } = await supabase
      .from("classroom_members")
      .select("*", { count: "exact", head: true })
      .eq("classroom_id", id);

    return {
      id: data.id,
      name: data.name,
      subject: data.subject,
      inviteCode: data.invite_code,
      inviteUrl: buildJoinUrl(data.invite_code, baseUrl),
      enrolledCount: count ?? 0,
    };
  } catch {
    return null;
  }
}

export async function getOfficerDashboardData(): Promise<OfficerDashboardData> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const empty: OfficerDashboardData = {
    officerName: "Dr. Smith",
    classrooms: [],
    stats: {
      totalStudents: 0,
      groupsCreated: 0,
      activeTasks: 0,
      tasksNeedingReview: 0,
    },
  };

  try {
    const supabase = await createClient();

    const { data: classrooms, error: classroomsError } = await supabase
      .from("classrooms")
      .select("id, name, subject, invite_code")
      .order("created_at", { ascending: false });

    if (classroomsError) return empty;

    const { data: members } = await supabase
      .from("classroom_members")
      .select("classroom_id");

    const memberCountByClassroom = new Map<string, number>();
    members?.forEach((m) => {
      const id = m.classroom_id as string;
      memberCountByClassroom.set(id, (memberCountByClassroom.get(id) ?? 0) + 1);
    });

    const { count: totalStudents } = await supabase
      .from("classroom_members")
      .select("*", { count: "exact", head: true });

    const { count: groupsCreated } = await supabase
      .from("groups")
      .select("*", { count: "exact", head: true });

    const { count: activeTasks } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .neq("status", "done");

    const { count: tasksNeedingReview } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "review");

    const dashboardClassrooms: DashboardClassroom[] = (classrooms ?? []).map(
      (c) => ({
        id: c.id,
        name: c.name,
        subject: c.subject,
        inviteCode: c.invite_code,
        inviteUrl: buildJoinUrl(c.invite_code, baseUrl),
        memberCount: memberCountByClassroom.get(c.id) ?? 0,
      })
    );

    return {
      officerName: "Dr. Smith",
      classrooms: dashboardClassrooms,
      stats: {
        totalStudents: totalStudents ?? 0,
        groupsCreated: groupsCreated ?? 0,
        activeTasks: activeTasks ?? 0,
        tasksNeedingReview: tasksNeedingReview ?? 0,
      },
    };
  } catch {
    return empty;
  }
}

export async function createClassroom(
  input: z.infer<typeof createClassroomSchema>
): Promise<CreateClassroomResult> {
  const parsed = createClassroomSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, subject, maxGroups, rules } = parsed.data;
  const inviteCode = generateInviteCode();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = buildJoinUrl(inviteCode, baseUrl);

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Sign in as an officer to create classrooms." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "officer") {
      return {
        success: false,
        error: "Only officer accounts can create classrooms.",
      };
    }

    const { data, error } = await supabase
      .from("classrooms")
      .insert({
        name,
        subject: subject || null,
        invite_code: inviteCode,
        max_groups: maxGroups,
        rules: rules || null,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error) {
      return {
        success: false,
        error:
          error.message.includes("relation") || error.message.includes("schema")
            ? "Database not ready. Run supabase/migrations in your Supabase project."
            : error.message,
      };
    }

    revalidatePath(routes.officer.dashboard);

    return {
      success: true,
      classroomId: data.id,
      inviteCode,
      inviteUrl,
    };
  } catch {
    return {
      success: false,
      error: "Could not connect to Supabase. Check your environment variables.",
    };
  }
}
