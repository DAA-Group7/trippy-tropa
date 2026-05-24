/** In-app copy for group balancing (mirrors docs/algorithms/greedy-group-balancing.md). */

export type GroupBalanceDocSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export const GROUP_BALANCING_SECTIONS: GroupBalanceDocSection[] = [
  {
    id: "summary",
    title: "In one sentence",
    paragraphs: [
      "Students are sorted from highest to lowest overall skill score, then each is placed into the group that currently has the lowest total — greedy load balancing.",
    ],
  },
  {
    id: "sort",
    title: "Why sort strongest students first?",
    paragraphs: [
      "We use each student's overall balance score (classroom weighted total when configured, otherwise the sum of communication, leadership, technical, and teamwork).",
      "Sorting highest-first is the standard Longest Processing Time (LPT) heuristic: place the 'heaviest' students early onto the lightest groups so strong students do not pile up at the end.",
    ],
  },
  {
    id: "steps",
    title: "The three steps",
    bullets: [
      "Compute one overall score per student.",
      "Sort students from highest score to lowest.",
      "Assign each student to the group with the lowest current total (ties → smaller group).",
    ],
  },
  {
    id: "leaders",
    title: "Group leaders",
    paragraphs: [
      "Balancing uses the overall score. Leaders are chosen separately: highest leadership rating in each group when auto-assign leader is on.",
    ],
  },
  {
    id: "limits",
    title: "Limitations",
    bullets: [
      "Greedy — not every possible split is compared.",
      "Does not consider friendships, schedules, or personality.",
      "Drag-and-drop before publish fixes anything you disagree with.",
    ],
  },
];
