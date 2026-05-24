"use server";

import { createClient } from "@/lib/supabase/server";
import { classroomHeaderGradients } from "@/lib/design/stitch";
import type { TaskStatus } from "@/types/database";

export type StudentDashboardClassroom = {
  id: string;
  code: string;
  name: string;
  professor: string;
  pendingTasks: number;
  headerClass: string;
  subtitle: string;
  subtitleClass: string;
};

export type StudentDashboardActiveTask = {
  id: string;
  title: string;
  classroom: string;
  dueLabel: string;
  urgent: boolean;
};

export type StudentDashboardOverview = {
  classrooms: StudentDashboardClassroom[];
  activeTasks: StudentDashboardActiveTask[];
};

function displayName(fullName: string | null, email: string): string {
  if (fullName?.trim()) return fullName.trim();
  return email.split("@")[0] ?? "Instructor";
}

export async function getStudentDashboardOverview(): Promise<StudentDashboardOverview> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { classrooms: [], activeTasks: [] };
  }

  const { data: memberships } = await supabase
    .from("classroom_members")
    .select("classroom_id")
    .eq("user_id", user.id);

  const classroomIds = (memberships ?? []).map((m) => m.classroom_id as string);
  if (classroomIds.length === 0) {
    return { classrooms: [], activeTasks: [] };
  }

  const { data: classrooms } = await supabase
    .from("classrooms")
    .select("id, name, subject, created_by")
    .in("id", classroomIds)
    .order("name");

  const officerIds = [
    ...new Set((classrooms ?? []).map((c) => c.created_by as string)),
  ];
  const { data: officers } = officerIds.length
    ? await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", officerIds)
    : { data: [] };

  const officerById = new Map((officers ?? []).map((o) => [o.id, o]));

  const { data: groups } = await supabase
    .from("groups")
    .select("id, classroom_id")
    .in("classroom_id", classroomIds);

  const groupIds = (groups ?? []).map((g) => g.id);
  const groupToClassroom = new Map(
    (groups ?? []).map((g) => [g.id, g.classroom_id as string])
  );

  const { data: myGroups } = groupIds.length
    ? await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id)
        .in("group_id", groupIds)
    : { data: [] };

  const myGroupIds = new Set((myGroups ?? []).map((m) => m.group_id as string));

  const { data: tasks } = groupIds.length
    ? await supabase
        .from("tasks")
        .select("id, title, status, deadline, group_id, assigned_to")
        .in("group_id", groupIds)
    : { data: [] };

  const classroomCards: StudentDashboardClassroom[] = (classrooms ?? []).map(
    (c, index) => {
      const officer = officerById.get(c.created_by as string);
      const professor = officer
        ? `Prof. ${displayName(officer.full_name, officer.email)}`
        : "Instructor";

      const classroomGroupIds = (groups ?? [])
        .filter((g) => g.classroom_id === c.id)
        .map((g) => g.id);

      const pendingTasks = (tasks ?? []).filter(
        (t) =>
          classroomGroupIds.includes(t.group_id as string) &&
          myGroupIds.has(t.group_id as string) &&
          t.assigned_to === user.id &&
          (t.status as TaskStatus) !== "done"
      ).length;

      const gradient =
        classroomHeaderGradients[index % classroomHeaderGradients.length];

      return {
        id: c.id,
        code: c.subject ?? c.name.split("—")[0]?.trim() ?? c.name,
        name: c.name,
        professor,
        pendingTasks,
        headerClass: `bg-gradient-to-r ${gradient}`,
        subtitle: pendingTasks > 0 ? "Active" : "On track",
        subtitleClass:
          pendingTasks > 0 ? "text-[#dbe1ff]" : "text-white/80",
      };
    }
  );

  const activeTasks: StudentDashboardActiveTask[] = (tasks ?? [])
    .filter(
      (t) =>
        myGroupIds.has(t.group_id as string) &&
        t.assigned_to === user.id &&
        (t.status as TaskStatus) !== "done"
    )
    .slice(0, 6)
    .map((t) => {
      const classroomId = groupToClassroom.get(t.group_id as string);
      const classroom = (classrooms ?? []).find((c) => c.id === classroomId);
      const deadline = t.deadline ? new Date(t.deadline as string) : null;
      const now = Date.now();
      const urgent =
        deadline !== null && deadline.getTime() - now < 48 * 60 * 60 * 1000;

      return {
        id: t.id,
        title: t.title,
        classroom: classroom?.subject ?? classroom?.name ?? "Classroom",
        dueLabel: deadline
          ? deadline.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })
          : "No deadline",
        urgent,
      };
    });

  return { classrooms: classroomCards, activeTasks };
}

export type StudentTaskHubItem = {
  id: string;
  title: string;
  status: TaskStatus;
  classroomId: string;
  classroomName: string;
  classroomLabel: string;
  dueLabel: string;
  urgent: boolean;
};

export type StudentTaskHubClassroom = {
  id: string;
  name: string;
  hasGroup: boolean;
  openTaskCount: number;
};

export type StudentTasksHubData = {
  tasks: StudentTaskHubItem[];
  classrooms: StudentTaskHubClassroom[];
};

export async function getStudentTasksHub(): Promise<StudentTasksHubData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { tasks: [], classrooms: [] };
  }

  const { data: memberships } = await supabase
    .from("classroom_members")
    .select("classroom_id")
    .eq("user_id", user.id);

  const classroomIds = (memberships ?? []).map((m) => m.classroom_id as string);
  if (classroomIds.length === 0) {
    return { tasks: [], classrooms: [] };
  }

  const { data: classrooms } = await supabase
    .from("classrooms")
    .select("id, name, subject")
    .in("id", classroomIds)
    .order("name");

  const { data: groups } = await supabase
    .from("groups")
    .select("id, classroom_id")
    .in("classroom_id", classroomIds);

  const groupIds = (groups ?? []).map((g) => g.id);
  const groupToClassroom = new Map(
    (groups ?? []).map((g) => [g.id, g.classroom_id as string])
  );

  const { data: myGroups } = groupIds.length
    ? await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id)
        .in("group_id", groupIds)
    : { data: [] };

  const myGroupIds = new Set((myGroups ?? []).map((m) => m.group_id as string));

  const { data: tasks } = groupIds.length
    ? await supabase
        .from("tasks")
        .select("id, title, status, deadline, group_id, assigned_to")
        .in("group_id", groupIds)
    : { data: [] };

  const openAssigned = (tasks ?? []).filter(
    (t) =>
      myGroupIds.has(t.group_id as string) &&
      t.assigned_to === user.id &&
      (t.status as TaskStatus) !== "done"
  );

  const hubTasks: StudentTaskHubItem[] = [...openAssigned]
    .sort((a, b) => {
      const aMs = a.deadline
        ? new Date(a.deadline as string).getTime()
        : Number.MAX_SAFE_INTEGER;
      const bMs = b.deadline
        ? new Date(b.deadline as string).getTime()
        : Number.MAX_SAFE_INTEGER;
      return aMs - bMs;
    })
    .map((t) => {
      const classroomId = groupToClassroom.get(t.group_id as string)!;
      const classroom = (classrooms ?? []).find((c) => c.id === classroomId);
      const deadline = t.deadline ? new Date(t.deadline as string) : null;
      const now = Date.now();
      const urgent =
        deadline !== null && deadline.getTime() - now < 48 * 60 * 60 * 1000;

      return {
        id: t.id,
        title: t.title,
        status: t.status as TaskStatus,
        classroomId,
        classroomName: classroom?.name ?? "Classroom",
        classroomLabel: classroom?.subject ?? classroom?.name ?? "Classroom",
        dueLabel: deadline
          ? deadline.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })
          : "No deadline",
        urgent,
      };
    });

  const hubClassrooms: StudentTaskHubClassroom[] = (classrooms ?? []).map((c) => {
    const classroomGroupIds = (groups ?? [])
      .filter((g) => g.classroom_id === c.id)
      .map((g) => g.id);
    const hasGroup = classroomGroupIds.some((gid) => myGroupIds.has(gid));
    const openTaskCount = openAssigned.filter((t) =>
      classroomGroupIds.includes(t.group_id as string)
    ).length;

    return {
      id: c.id,
      name: c.name,
      hasGroup,
      openTaskCount,
    };
  });

  return { tasks: hubTasks, classrooms: hubClassrooms };
}
