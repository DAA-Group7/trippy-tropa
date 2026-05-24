import { routes } from "@/lib/constants/routes";

/** Whether the student Tasks nav item should appear active. */
export function isStudentTasksNavActive(pathname: string): boolean {
  if (pathname === routes.student.tasksHub) return true;
  if (/^\/student\/classrooms\/[^/]+\/group/.test(pathname)) return true;
  if (/^\/student\/classrooms\/[^/]+\/tasks/.test(pathname)) return true;
  return false;
}
