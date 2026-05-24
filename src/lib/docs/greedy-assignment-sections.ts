/** In-app copy for the auto-assign help guide (mirrors docs/algorithms/greedy-assignment.md). */

export type DocSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  table?: { headers: string[]; rows: string[][] };
};

export const GREEDY_ASSIGNMENT_SECTIONS: DocSection[] = [
  {
    id: "summary",
    title: "In one sentence",
    paragraphs: [
      "For each group, Trippy-Tropa uses the Hungarian algorithm to find the best overall pairing of tasks and members (who still have time budget), based on skill fit and hours from the time estimate matrix.",
    ],
  },
  {
    id: "prerequisites",
    title: "Before you click Auto assign",
    bullets: [
      "Groups are published and students are placed in a group.",
      "Students have completed skill onboarding (ratings on file).",
      "The time estimate matrix is complete — each member entered hours for themselves on each task (when your class uses estimates).",
      "Tasks exist; add required skills on tasks where fit matters (e.g. Technical 4).",
    ],
  },
  {
    id: "inputs",
    title: "What the system looks at",
    table: {
      headers: ["Input", "Source", "Why it matters"],
      rows: [
        [
          "Required skills",
          "Task settings",
          "Defines what a good match looks like",
        ],
        [
          "Student skills",
          "Onboarding / class assessment",
          "Compared to each task's requirements",
        ],
        [
          "Hours per task",
          "Student time estimate matrix",
          "Must be greater than zero to be eligible",
        ],
        [
          "Remaining hours",
          "Starts at 40h per student per run",
          "Spreads work so one person cannot take everything",
        ],
      ],
    },
  },
  {
    id: "steps",
    title: "How matching works",
    paragraphs: [
      "Auto-assign runs separately for each group. The Hungarian algorithm runs in rounds:",
    ],
    bullets: [
      "List tasks still waiting for an assignee.",
      "Score every valid task–member pair (skill fit + enough hours left).",
      "Find the pairing that maximizes overall fit for this round (Hungarian minimum-cost matching).",
      "Assign those tasks, subtract hours from each student's budget.",
      "Repeat with remaining tasks until no more valid pairings.",
    ],
  },
  {
    id: "skill-fit",
    title: "Skill match in plain language",
    paragraphs: [
      "Tasks can require skills with weights from 1 (nice to have) to 5 (essential). Students rated higher on heavily weighted skills score better.",
      "The assignment matrix shows match as a percentage. If a task has no required skills, everyone is treated equally on skills; hours and budget still decide who gets the task.",
    ],
  },
  {
    id: "buttons",
    title: "Auto assign vs Reassign all",
    table: {
      headers: ["Button", "What it does"],
      rows: [
        [
          "Auto assign",
          "Fills only tasks with no assignee. Leaves current assignments unchanged.",
        ],
        [
          "Reassign all",
          "Re-runs matching for every task. Assignees may change — confirm with your class if needed.",
        ],
      ],
    },
  },
  {
    id: "limitations",
    title: "Limitations to know",
    bullets: [
      "Each round optimizes that batch; later rounds see fewer tasks and tighter hour budgets.",
      "No time estimate for a task means it cannot be auto-assigned.",
      "The 40-hour cap is a simple planning limit, not a real calendar.",
      "Skill ratings are self-reported summaries.",
      "When fairness or context matters more than automation, use manual override after auto-assign.",
    ],
  },
  {
    id: "speed",
    title: "How fast is it?",
    paragraphs: [
      "For typical classes (dozens of students and tasks per group), auto-assign still finishes in under a second per group on the server.",
      "Each round uses the Hungarian method — fast enough for normal classroom sizes.",
    ],
  },
  {
    id: "tips",
    title: "Tips for instructors",
    bullets: [
      "Set required skills on tasks where expertise matters.",
      "Wait for the time matrix before auto-assign.",
      "Review the assignment heatmap after running auto-assign.",
      "Use Reassign all sparingly if students already started work.",
      "Override individual tasks when you know something the system cannot (absence, roles, equity).",
    ],
  },
];
