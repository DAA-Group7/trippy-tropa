export type TaskStatus = "in_progress" | "todo";

export const STUDENT_PROFILE = {
  firstName: "Alex",
  avatarUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAh2BGkjwDygNjYtJ2en8B9agTZw2pxTCzZ035sNSQCq9WOvZhA9IbrO-7I8rpir0cG2kt1D91FsI6QXbLOWG9lfX2G8UTh8l0fB4ZBqHWmK2nORriLKYKt7WlUel0Ef5zl4OB5buC1Q3gZCazO2LieHBJD9Ap7k2H4WkBsfORMLUPatd3cm7XyOZasbQz0poh9qqoOYAa63TY6-83DKAyj6teu9qFIc0r2KoXpCOPzTmRzWoznY1htyMg-UYe2mUePvyrxwkXis5Q",
};

export const INSTITUTION_LOGO_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDXGbXZ4tNUew15z0Lf1ee4VrDi804sx5I02TDWC6bOLYHorZpPwhRP6-mC5Uh2seIX8J1EyDoDkJlwb_9-XsfhGYfGw98j_2IJmPoRc1Cdq9WzdHCT6W8DDqp84xjdh7_ZTJNumoAV1ZUsOw4ib6qFCkegTw8Oa9a8SbCuLuC6CCs9BkC8dqbT-fLkGkfZA-JKb-ReS0AYhCsKartXIOPKg93gk4vDJYFOvZkg25A-PeMD4spp9nNxbidX6AdzGfNYGvKCkElIuwE";

export const DEMO_ACTIVE_TASKS = [
  {
    id: "1",
    title: "Research Methodology Paper",
    description: "Drafting literature review section.",
    status: "in_progress" as TaskStatus,
    dueLabel: "Due Tomorrow, 11:59 PM",
    urgent: true,
  },
  {
    id: "2",
    title: "Data Structures Assignment 4",
    description: "Implement AVL Tree balancing.",
    status: "todo" as TaskStatus,
    dueLabel: "Due Friday",
    urgent: false,
  },
];

export type UpdateIcon = "group" | "warning" | "forum";

export const DEMO_UPDATES: {
  id: string;
  icon: UpdateIcon;
  highlight?: string;
  message: string;
  time: string;
  highlighted?: boolean;
}[] = [
  {
    id: "1",
    icon: "group",
    highlight: "Group 4",
    message: "uploaded a new file for the final project presentation.",
    time: "2 hours ago",
  },
  {
    id: "2",
    icon: "warning",
    highlight: "Dr. Smith",
    message: "changed the deadline for the mid-term paper.",
    time: "5 hours ago",
    highlighted: true,
  },
  {
    id: "3",
    icon: "forum",
    message: "New discussion post in Advanced Calculus.",
    time: "1 day ago",
  },
];

export const DEMO_STUDENT_CLASSROOMS = [
  {
    id: "demo-cs301",
    code: "Computer Science 301",
    subtitle: "Data Structures",
    professor: "Prof. Alan Turing",
    pendingTasks: 4,
    headerClass: "from-[#004ac6] to-[#0053db]",
    subtitleClass: "text-[#dbe1ff]",
  },
  {
    id: "demo-hist205",
    code: "History 205",
    subtitle: "Modern Europe",
    professor: "Prof. E. H. Carr",
    pendingTasks: 1,
    headerClass: "from-[#943700] to-[#bc4800]",
    subtitleClass: "text-[#ffdbcd]",
  },
  {
    id: "demo-math402",
    code: "Mathematics 402",
    subtitle: "Advanced Calculus",
    professor: "Prof. L. Euler",
    pendingTasks: 0,
    headerClass: "from-[#505f76] to-[#d0e1fb]",
    subtitleClass: "text-[#d3e4fe]",
  },
];
