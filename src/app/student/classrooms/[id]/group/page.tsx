import { Crown, MessageSquare } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = { title: "Group workspace" };

export default async function GroupWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Group workspace"
        description={`Classroom ${id} — members, discussion, and progress.`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>Group leader is highlighted</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2">
              <span className="text-sm font-medium">Team leader</span>
              <Crown className="size-4 text-primary" />
            </div>
            <div className="rounded-lg bg-muted px-3 py-2 text-sm">Member —</div>
            <div className="rounded-lg bg-muted px-3 py-2 text-sm">Member —</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="size-5 text-primary" />
              Discussion
            </CardTitle>
            <CardDescription>
              Real-time chat via Supabase Realtime (to be wired)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              Group chat messages appear here
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Progress overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary">In progress</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
