export const APP_NAME = "CollabClass";

export const routes = {
  home: "/",
  login: "/login",
  register: "/register",
  join: "/join",
  joinByCode: (code: string) => `/join/c/${code}`,
  onboarding: "/onboarding/skills",
  officer: {
    dashboard: "/officer/dashboard",
    createClassroom: "/officer/classrooms/new",
    classroom: (id: string) => `/officer/classrooms/${id}`,
    generateGroups: (id: string) => `/officer/classrooms/${id}/groups/generate`,
    groups: (id: string) => `/officer/classrooms/${id}/groups`,
    tasks: (id: string) => `/officer/classrooms/${id}/tasks`,
  },
  student: {
    dashboard: "/student/dashboard",
    group: (classroomId: string) => `/student/classrooms/${classroomId}/group`,
    tasks: (classroomId: string) => `/student/classrooms/${classroomId}/tasks`,
    assignments: (classroomId: string) =>
      `/student/classrooms/${classroomId}/assignments`,
  },
} as const;
