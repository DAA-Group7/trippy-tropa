import type { SkillKey } from "@/types/database";

export const SKILL_DEFINITIONS: {
  key: SkillKey;
  label: string;
  description: string;
  tooltip: string;
}[] = [
  {
    key: "communication",
    label: "Communication",
    description: "Expressing ideas clearly and listening actively",
    tooltip:
      "Ability to clearly convey ideas and information verbally and in writing.",
  },
  {
    key: "leadership",
    label: "Leadership",
    description: "Guiding the team and coordinating work",
    tooltip:
      "Capacity to guide, inspire, and manage a team towards common goals.",
  },
  {
    key: "technical",
    label: "Technical",
    description: "Research, tools, and subject-matter expertise",
    tooltip:
      "Proficiency in required software, tools, and industry-specific hard skills.",
  },
  {
    key: "teamwork",
    label: "Teamwork",
    description: "Collaborating and supporting group members",
    tooltip:
      "Ability to collaborate effectively and harmoniously with others.",
  },
];

export const RATING_OPTIONS = [
  { value: 1, label: "1 - Novice", shortLabel: "1" },
  { value: 2, label: "2", shortLabel: "2" },
  { value: 3, label: "3 - Proficient", shortLabel: "3" },
  { value: 4, label: "4", shortLabel: "4" },
  { value: 5, label: "5 - Expert", shortLabel: "5" },
] as const;

export const ONBOARDING_STEPS = [
  { id: 1, label: "Skills" },
  { id: 2, label: "Experience" },
  { id: 3, label: "Review" },
] as const;
