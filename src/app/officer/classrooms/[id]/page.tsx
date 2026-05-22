import Link from "next/link";
import { Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { routes } from "@/lib/constants/routes";

export const metadata = { title: "Classroom" };

export default async function ClassroomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Classroom"
        description={`Classroom ID: ${id} — students, skills overview, and group actions.`}
        action={
          <Button render={<Link href={routes.officer.generateGroups(id)} />}>
            <Sparkles className="size-4" />
            Generate groups
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Communication", "Leadership", "Technical", "Teamwork"].map(
          (label) => (
            <Card key={label} className="shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>{label}</CardDescription>
                <CardTitle className="text-2xl">—</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Class average (1–5)
                </p>
              </CardContent>
            </Card>
          )
        )}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            Joined students
          </CardTitle>
          <CardDescription>
            Students who completed skill assessment appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Connect Supabase to load enrolled students for this classroom.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
