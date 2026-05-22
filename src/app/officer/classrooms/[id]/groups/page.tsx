import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = { title: "Groups" };

export default async function OfficerGroupsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Group management"
        description="View and override group composition, leaders, and progress."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {["Group A", "Group B"].map((name) => (
          <Card key={name} className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                {name}
                <Badge>In progress</Badge>
              </CardTitle>
              <CardDescription>Leader highlighted in member list</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="rounded-lg bg-primary/10 px-3 py-2 font-medium text-primary">
                  Leader — (assign from roster)
                </li>
                <li className="rounded-lg bg-muted px-3 py-2">Member —</li>
                <li className="rounded-lg bg-muted px-3 py-2">Member —</li>
              </ul>
              <Button variant="outline" size="sm" type="button">
                Edit composition
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
