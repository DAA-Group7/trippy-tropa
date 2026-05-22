import { Bell, BookOpen } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata = { title: "Student dashboard" };

const notifications = [
  { title: "Group assigned", body: "You were placed in Group B for CS 101." },
  { title: "Task update", body: "Research outline moved to In Progress." },
  { title: "Deadline", body: "Draft due in 3 days." },
];

export default function StudentDashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="My classrooms"
        description="Classrooms you joined and recent activity."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-lg font-semibold">Joined classrooms</h2>
          <EmptyState
            title="No classrooms yet"
            description="Use an invite link from your teacher to join a class."
          />
        </div>

        <Card className="shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="size-4 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>Group, task, and deadline updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.title}
                className="rounded-lg border border-border bg-card p-3 text-sm"
              >
                <p className="font-medium">{n.title}</p>
                <p className="mt-1 text-muted-foreground">{n.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-dashed shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="size-4 text-primary" />
            Skill assessment
          </CardTitle>
          <CardDescription>
            Complete onboarding before groups can be assigned to you.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
