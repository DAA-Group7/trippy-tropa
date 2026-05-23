export type UserRole = "officer" | "student";

export type TaskStatus = "todo" | "in_progress" | "review" | "done";

export type SkillKey =
  | "communication"
  | "leadership"
  | "technical"
  | "teamwork";

export interface SkillRatings {
  communication: number;
  leadership: number;
  technical: number;
  teamwork: number;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  skills_completed: boolean;
  created_at: string;
}

export interface Classroom {
  id: string;
  name: string;
  subject: string | null;
  invite_code: string;
  max_groups: number;
  created_by: string;
  created_at: string;
}

export interface Group {
  id: string;
  classroom_id: string;
  name: string;
  leader_id: string | null;
  progress_status: string;
}

export interface Task {
  id: string;
  group_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assigned_to: string | null;
  deadline: string | null;
  estimated_hours: number | null;
  required_skills?: Partial<SkillRatings>;
  assignment_match_score?: number | null;
  assignment_reason?: string | null;
}
