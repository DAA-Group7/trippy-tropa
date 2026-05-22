import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { routes } from "@/lib/constants/routes";

export default async function GenerateGroupsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const previewGroups = [
    { name: "Group A", members: 4, leader: "Auto-assigned" },
    { name: "Group B", members: 4, leader: "Auto-assigned" },
    { name: "Group C", members: 3, leader: "Auto-assigned" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Generate groups"
        description="Skill-balanced groups with optional manual adjustments before saving."
      />

      <div className="flex flex-wrap gap-2">
        <Button type="button">Regenerate balanced groups</Button>
        <Button variant="outline" type="button">
          Auto-assign leaders
        </Button>
        <Button variant="secondary" type="button">
          Manual adjust mode
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {previewGroups.map((g) => (
          <Card key={g.name} className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {g.name}
                <Badge variant="secondary">{g.members} members</Badge>
              </CardTitle>
              <CardDescription>Leader: {g.leader}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Skill distribution preview — wire up balancing algorithm in{" "}
                <code className="text-xs">lib/algorithms/group-balancer.ts</code>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        <Button type="button">Save groups</Button>
        <Button variant="outline" render={<Link href={routes.officer.groups(id)} />}>
          View all groups
        </Button>
      </div>
    </div>
  );
}
