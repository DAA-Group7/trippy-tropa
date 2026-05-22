export type GroupStatus = "in_progress" | "reviewing" | "planning" | "done";

export type GroupFilter = "all" | "in_progress" | "done";

export type GroupMember = {
  id: string;
  avatarUrl?: string;
};

export type DemoManagedGroup = {
  id: string;
  name: string;
  status: GroupStatus;
  statusLabel: string;
  leaderName: string;
  leaderAvatarUrl?: string;
  leaderInitials?: string;
  members: GroupMember[];
  extraMemberCount: number;
  progress: number;
  progressLabel: string;
};

export const DEMO_MANAGED_GROUPS: DemoManagedGroup[] = [
  {
    id: "alpha",
    name: "Alpha Cohort",
    status: "in_progress",
    statusLabel: "In Progress",
    leaderName: "Dr. E. Hayes",
    leaderAvatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAchKobb6DFEs-VXKjvuF0BbacrlCqL22m8GTv4TPitK-vIMdQO97VhG-3HqGBYR6H8TAUv6uUo4LIc985NJbgY0SPOriWGV1S5CzUTHItZMsf51HdIZjzJwxZzsLv1I086udA6PrQqPdTIQ78Vt2uVrJeocXYElhpqmY3H8L7xpNUXU5XkD4AVAlLaWh76B-raBzpW3bBslXLCQjnCtnHWJOeAV7k9ZFWfd9iY7UvEGp_hMe-4Pa95cO-vO0GpNBImXZ1VakVxl1c",
    members: [
      {
        id: "m1",
        avatarUrl:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDpObhKBX33D9fhFfZ4wB7XnLSU8QRS4Qe24tabSkye1ZFN_cq9f5dkcbcpmIkLNSbo7RJ4u7JGq2ODzPIMoZL94zyHJAvscEC2vPC39lqSZy7QVokYIakqRCioewG1Ixgkag0NnGUDL_i4XJYfx_m8aV9tC2m0XCm1hQ9pPbSyX0ey8lYxS-Yg9XeGMvCGpDwuAfQ_aUwlNuK-vmMVEVkEYEfWIzJB0tY2j69cVNNipuU008-fteXRsa51uG9OwXmR4yeOoBtLmD8",
      },
      {
        id: "m2",
        avatarUrl:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDd-Lj_hgOXRPLmgCcDHtL_ztazRdBRMrNhwEM6gdU2fxJXoys3PULZWQQvgwTkiHrxcuZrFYk-8giegp8cUDdXR0AoBxVPQNZjFqOZaZmtp9rL-2lKzSovTSS57CfiM61K65SgStnlFUzHlXcEyPUjKWnW7EbWXJjBRh-PpLUFCdpEANA4s9T-6JYU49Q9yCSXqALIVa8tkUHCxO-2s0xPNwuoFWqV1z1bjD9ERARilS75l4epbxVzu02pISiOr6kB21WFOCwkk8g",
      },
      {
        id: "m3",
        avatarUrl:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCN70tzi-S6wsqU14wU1_9uhy5KI4HlVS1fBmK3aFEJ9CJfN-BL50YgEuy8I36nRyqDi5XI-9sXru0H6N_aiQ91E7G6HS7Se4t04GAWevgVXEEzGq8oIPuS7Zeml5OgN9P2ioSNIwId2pQzRwhLt_PQp2dCUPVVjLyw_mm4ojaUHl2itVKIFm1TIV1dRFrXW-QOVJOPDK2uBNl88h6vK0c_QRzLWXIa1ik347-KaoTd0uH2Cie79lebnEoB0LQqjjbQt5b4BFyg3As",
      },
    ],
    extraMemberCount: 2,
    progress: 65,
    progressLabel: "65%",
  },
  {
    id: "beta",
    name: "Beta Synthesis",
    status: "reviewing",
    statusLabel: "Reviewing",
    leaderName: "Prof. M. Vance",
    leaderAvatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAg0lCOY_ccdGG8u1HJvxVWAxKY6ct6FU4SLjb-dZbFWtzr0ARMUl-e_0feEj5J8zBN1_JwcfAtLGcLyqHqM6Uw39b8Bga3pJPoN0Wpo9QFZlVKorRX1ERbSvbJSTEstO3GpudeBzUun-WGKH1-BNYQGidrImrilYNS40mbA9tIaKm6ImCdmWXmKpz81kPj1kQ0uvrlFYYxnO-yIbxzdJjQi-VylgqCKwpTApKFCN-gvtYaTi0Nt4u68-g9fZlChRxsSyN9afJnAIY",
    members: [
      {
        id: "m4",
        avatarUrl:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBPt9af0PuzpM2dqzJ0ninIIm9uEvPQBnch_FbcOBUUZ1DWlnde-pnUvDlQbo-zsAvAhLegiqdIC8_uWpxvKju-qpNSW4sEZNz2Ty7MI3b164hpE-Fm7MBPRAbooAE2xXlxCmpBa2dvSdlJlSLPa2CN2ZrI8YANUSzBWFMfwkCVSsvzg79-wyIIM6SNLT3sXm-IOLBslECYRObVwr06w9Alss9_tyK1LhGFWoNU_v3b_d9SuKOAgBJNSfglJhMVY9IlrLtEFeT3NKU",
      },
      {
        id: "m5",
        avatarUrl:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuAIGfNRsok9zm6eh7-9-NdPtHZ-vm4N-xmqo3idAnQVhHlX4r-vWQqRSU14JLY66SsfZ4vHRsBX9P34ahrUJrpFwrcVyVbY1q9rV4oLJ2g0so8WDwqxMrDizdG6_OQgZfTNau_nKqjxZx26vZm0WQp3SvlmbO_2A7HICUDg-npKxATgqtfAB4-PdfZ3OgTlzODCGftEb0hhOc1FxobrhMkq5NIgA-nxc3o6VYhFueJhBf997ZbMiL96WhJAxDGPc_IVH_Oh3vuPBcI",
      },
    ],
    extraMemberCount: 1,
    progress: 92,
    progressLabel: "92%",
  },
  {
    id: "gamma",
    name: "Gamma Research",
    status: "planning",
    statusLabel: "Planning",
    leaderName: "Dr. S. Jones",
    leaderInitials: "SJ",
    members: [
      {
        id: "m6",
        avatarUrl:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBp_pgvSWYQfVR3Ok9vLjejP9zIKbhJc4Ipt6A_Tp3bEAMqpA_g9rmxb8LuqHtQx-bCBGVQvJyfn6_FXm3JD7f67osS2u_Y9jiMfyeFtfTifE75NOrgkfMgTigWd-3PGgj6wHrVhc9voGQes9R4ZzoWNLyMfOahSHg2wrU_H0Fu3cCMxuY7ZzcuCfk1MLvOMNkTcNqjb01QG7mub393xpHJaxxf-6cvpkwT8lIgdxfgUC7GygY4Cr9GF1DVWWsExBbZVweQS48spNI",
      },
      {
        id: "m7",
        avatarUrl:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBqU4lS4c4C1WnyWtyNFUUttrvxyrscOtmEij3rSfp4SqXFx8WhadnlYe_pbUD-uBcCN6de05JlX3d6r-zVQ8P2GhnwKrZWMW48ToVXBZ8s43DpaSBtqmui1YpHSAn2bcElclxh8bAN_SvFMCwkloLWX3OogdLXUY5DQwS3oAcYkN-mQKXsmUSEIfta-oRQ4ZPkCVz3ZuyNXwVl8dqx_5qDW_WhhUBqvr8q4ZYLuuIlEQ9HGy6prtdEokJgX4HAtVfH40GasUHawrE",
      },
    ],
    extraMemberCount: 0,
    progress: 15,
    progressLabel: "15%",
  },
];

export function getStatusBadgeClass(status: GroupStatus): string {
  switch (status) {
    case "in_progress":
      return "bg-[#d3e4fe] text-[#0b1c30]";
    case "reviewing":
      return "bg-[#ffdbcd] text-[#360f00]";
    case "planning":
      return "bg-[#e7e7f3] text-[#434655]";
    case "done":
      return "bg-[#d0e1fb] text-[#54647a]";
    default:
      return "bg-[#e7e7f3] text-[#434655]";
  }
}

export function getProgressBarClass(status: GroupStatus): string {
  switch (status) {
    case "in_progress":
      return "bg-[#004ac6]";
    case "reviewing":
      return "bg-[#943700]";
    case "planning":
      return "bg-[#505f76]";
    case "done":
      return "bg-[#004ac6]";
    default:
      return "bg-[#505f76]";
  }
}

export function getProgressTextClass(status: GroupStatus): string {
  switch (status) {
    case "in_progress":
      return "text-[#004ac6]";
    case "reviewing":
      return "text-[#943700]";
    default:
      return "text-[#191b23]";
  }
}

export function matchesFilter(
  group: DemoManagedGroup,
  filter: GroupFilter
): boolean {
  if (filter === "all") return true;
  if (filter === "done") return group.status === "done";
  return group.status === "in_progress" || group.status === "reviewing";
}
