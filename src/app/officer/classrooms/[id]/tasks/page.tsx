import { Plus, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = { title: "Task management" };

export default async function OfficerTasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Task management"
        description="Create tasks per group and run skill + time-based auto assignment."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" type="button">
              <Wand2 className="size-4" />
              Auto assign tasks
            </Button>
            <Button type="button">
              <Plus className="size-4" />
              New task
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge>To Do</Badge>
        <Badge variant="secondary">In Progress</Badge>
        <Badge variant="outline">Done</Badge>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Assignment optimization</CardTitle>
          <CardDescription>
            Students × tasks × estimated completion time
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Est. hours</TableHead>
                <TableHead>Match score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Run auto-assign to populate optimized results
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
