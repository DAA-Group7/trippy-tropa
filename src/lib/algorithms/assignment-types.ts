import type { SkillRatings } from "@/types/database";

export interface TaskToAssign {
  id: string;
  title: string;
  requiredSkills: Partial<SkillRatings>;
}

export interface StudentCapacity {
  id: string;
  name: string;
  skills: SkillRatings;
  availableHours: number;
}

export interface TaskAssignment {
  taskId: string;
  studentId: string;
  matchScore: number;
  reason: string;
}

export type EstimateHoursLookup = (
  studentId: string,
  taskId: string
) => number | null;
