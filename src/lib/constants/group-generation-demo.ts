export type GroupVarianceBadge = "high-variance" | "balanced" | "homogeneous";

export type DemoStudent = {
  id: string;
  name: string;
  initials: string;
  meta: string;
  avatarClass: string;
  isLeader?: boolean;
};

export type DemoGroup = {
  id: string;
  name: string;
  badge: { label: string; variant: GroupVarianceBadge };
  students: DemoStudent[];
};

export const BALANCING_STRATEGIES = [
  "Skill Balancing (Mixed)",
  "Skill Balancing (Homogeneous)",
  "Random Assignment",
] as const;

export const GROUP_SIZES = ["4 Students", "3 Students", "5 Students"] as const;

/** Placeholder data until balancing logic is wired */
export const DEMO_GROUPS: DemoGroup[] = [
  {
    id: "alpha",
    name: "Group Alpha",
    badge: { label: "High Variance", variant: "high-variance" },
    students: [
      {
        id: "s1",
        name: "Elena Johnson",
        initials: "EJ",
        meta: "GPA: 3.9 • Analytical",
        avatarClass: "bg-[#b4c5ff] text-[#003ea8]",
        isLeader: true,
      },
      {
        id: "s2",
        name: "Marcus Smith",
        initials: "MS",
        meta: "GPA: 3.4 • Creative",
        avatarClass: "bg-[#d3e4fe] text-[#0b1c30]",
      },
      {
        id: "s3",
        name: "Linda Chen",
        initials: "LC",
        meta: "GPA: 3.7 • Technical",
        avatarClass: "bg-[#d3e4fe] text-[#0b1c30]",
      },
    ],
  },
  {
    id: "beta",
    name: "Group Beta",
    badge: { label: "Balanced", variant: "balanced" },
    students: [
      {
        id: "s4",
        name: "David Park",
        initials: "DP",
        meta: "GPA: 3.8 • Analytical",
        avatarClass: "bg-[#b4c5ff] text-[#003ea8]",
        isLeader: true,
      },
      {
        id: "s5",
        name: "Anita Rodriguez",
        initials: "AR",
        meta: "GPA: 3.5 • Creative",
        avatarClass: "bg-[#d3e4fe] text-[#0b1c30]",
      },
      {
        id: "s6",
        name: "James Wilson",
        initials: "JW",
        meta: "GPA: 3.6 • Presenter",
        avatarClass: "bg-[#d3e4fe] text-[#0b1c30]",
      },
    ],
  },
];

export function getVarianceBadgeClass(variant: GroupVarianceBadge): string {
  switch (variant) {
    case "high-variance":
      return "bg-[#ffdbcd] text-[#360f00]";
    case "balanced":
      return "bg-[#d0e1fb] text-[#54647a]";
    default:
      return "bg-[#e7e7f3] text-[#434655]";
  }
}
