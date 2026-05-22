import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = { title: "Task assignments" };

export default async function TaskAssignmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const assignments = [
    {
      task: "Research outline",
      assignee: "You",
      reason: "Strong technical + communication scores",
      hours: 3,
    },
    {
      task: "Presentation slides",
      assignee: "Alex",
      reason: "Leadership score + available hours",
      hours: 4,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Optimized assignments"
        description={`How tasks were allocated for classroom ${id} based on skills and time.`}
      />

      <div className="space-y-4">
        {assignments.map((a) => (
          <Card key={a.task} className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                {a.task}
                <Badge>{a.hours}h estimated</Badge>
              </CardTitle>
              <CardDescription>Assigned to: {a.assignee}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Why: </span>
                {a.reason}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
