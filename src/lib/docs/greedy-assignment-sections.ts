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
      "For each task, Trippy-Tropa picks the group member who fits the required skills best among students who still have enough time budget left, using the hours they entered in the time estimate matrix.",
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
    title: "How it chooses assignees",
    paragraphs: [
      "Auto-assign runs separately for each group. Inside a group it works like this:",
    ],
    bullets: [
      "List tasks to assign (only unassigned tasks, unless you use Reassign all).",
      "Handle tasks one at a time, in order.",
      "For each task, consider members who entered hours for that task and still have enough budget left.",
      "Score each eligible member by skill fit (match %).",
      "Assign the task to the highest score.",
      "Subtract that task's hours from the student's remaining budget.",
      "Continue with the next task.",
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
      "Not guaranteed to be the best possible plan for the whole group — early picks affect later ones.",
      "Task processing order can change the outcome.",
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
      "For typical classes (dozens of students and tasks per group), auto-assign finishes in under a second per group on the server.",
      "The approach checks each student for each task — fast enough for normal classroom sizes.",
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
