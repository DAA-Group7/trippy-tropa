import type { SkillKey } from "@/types/database";

export const SKILL_DEFINITIONS: {
  key: SkillKey;
  label: string;
  description: string;
}[] = [
  {
    key: "communication",
    label: "Communication",
    description: "Expressing ideas clearly and listening actively",
  },
  {
    key: "leadership",
    label: "Leadership",
    description: "Guiding the team and coordinating work",
  },
  {
    key: "technical",
    label: "Technical skills",
    description: "Research, tools, and subject-matter expertise",
  },
  {
    key: "teamwork",
    label: "Teamwork",
    description: "Collaborating and supporting group members",
  },
];
