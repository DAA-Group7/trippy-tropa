export type SkillMetric = {
  label: string;
  percent: number;
  barClass: string;
};

export type RosterStudent = {
  id: string;
  name: string;
  email: string;
  grade: string;
  gradeWarning?: boolean;
  avatarUrl?: string;
  initials?: string;
  avatarClass?: string;
};

export const DEMO_SKILL_METRICS: SkillMetric[] = [
  { label: "Algorithmic Logic", percent: 92, barClass: "bg-[#004ac6]" },
  { label: "System Architecture", percent: 78, barClass: "bg-[#b4c5ff]" },
  { label: "Code Optimization", percent: 65, barClass: "bg-[#943700]" },
  { label: "Debugging & Testing", percent: 85, barClass: "bg-[#505f76]" },
  { label: "Technical Writing", percent: 70, barClass: "bg-[#737686]" },
];

export const DEMO_ROSTER_STUDENTS: RosterStudent[] = [
  {
    id: "1",
    name: "Alice Chen",
    email: "achen@university.edu",
    grade: "94% (A)",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA40IGUrzTcmicS4LVTRwooQ1AyEkWvHpMJy--wV3ZsoI4Xl6ii8C93d4Idqu5wBOsRkWoFxjT0w3mUsnxnM7s-AiQ3QSnnHxj6XtORbKXU8ZHRTYSpb9vWxvUrb-OEiYxZWVajUdNvD7E0LH_dzoH3ypJ9l3-r3XkADNwQIAU_Tt9fFU50ifgo1GsMBllHey4DgUE_IJb1HczhPpZ6rVvlP0EH5UGbdRAqiLuSbcM2_NXiodJT4mdqaJFaLZxPhdBsnZ6ndybDRj0",
  },
  {
    id: "2",
    name: "Benjamin Jacobs",
    email: "bjacobs@university.edu",
    grade: "88% (B+)",
    initials: "BJ",
    avatarClass: "bg-[#d0e1fb] text-[#54647a]",
  },
  {
    id: "3",
    name: "David Kim",
    email: "dkim@university.edu",
    grade: "91% (A-)",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuACjTIeLMTpmUIrFRkyyzAOx7drRyU9Pw0keqQyshAOgX6pNlkEuuSE3lggLlNrfrmV5X3OMN5-mALyT3st8z-b_V9ifUgDy6SZRvYV9cYqSuUP6hhR-dcpSIRE4LFXT3SaAdO_G3OxqdwQKY-frcdgRWKFZ4iXa6j1zfH51gpt8GW4V9mVo1uUn8Yhe0cv0Ios99igMiqvCWh1JUD9EJNNSvwdhB54r9WLvKGAhWL7O055B5Fb0D0Qy5H3bd_NFiTx0z-Nrnh2_iE",
  },
  {
    id: "4",
    name: "Elena Silva",
    email: "esilva@university.edu",
    grade: "76% (C+)",
    gradeWarning: true,
    initials: "ES",
    avatarClass: "bg-[#dbe1ff] text-[#00174b]",
  },
  {
    id: "5",
    name: "Marcus Washington",
    email: "mwashington@university.edu",
    grade: "89% (B+)",
    initials: "MW",
    avatarClass: "bg-[#e1e2ed] text-[#434655]",
  },
];

export const DEMO_CLASS_STATS = {
  enrolled: 32,
  classAverage: "88.4%",
  classAverageLetter: "B+",
  milestoneTitle: "Midterm Project",
  milestoneDue: "Due in 4 days",
};
