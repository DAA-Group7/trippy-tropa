import Link from "next/link";
import { Users, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BrandMark } from "@/components/brand/brand-mark";
import { APP_TAGLINE } from "@/lib/constants/brand";
import { routes } from "@/lib/constants/routes";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-secondary/40">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
        <BrandMark size="md" href={routes.home} showTagline={false} />
        <div className="flex gap-2">
          <Button variant="ghost" render={<Link href={routes.login} />}>
            Log in
          </Button>
          <Button render={<Link href={routes.register} />}>Get started</Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-4 pb-16 pt-8 text-center sm:px-6 sm:pt-16">
        <p className="rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-sm font-medium text-primary">
          {APP_TAGLINE}
        </p>
        <h1 className="mt-6 max-w-3xl font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Balanced groups. Optimized tasks. Better teamwork.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          A web-based platform for teachers and students to form skill-balanced
          groups, assign tasks intelligently, and track progress—on desktop and
          mobile browsers.
        </p>

        <div className="mt-10 grid w-full max-w-3xl gap-4 sm:grid-cols-2">
          <Card className="text-left shadow-md transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <LayoutDashboard className="size-5" />
              </div>
              <CardTitle>Officer / Teacher</CardTitle>
              <CardDescription>
                Create classrooms, generate balanced groups, and manage tasks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" render={<Link href={routes.officer.dashboard} />}>
                Open officer portal
              </Button>
            </CardContent>
          </Card>

          <Card className="text-left shadow-md transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="size-5" />
              </div>
              <CardTitle>Student</CardTitle>
              <CardDescription>
                Join a class, complete skill assessment, and collaborate in your
                group workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button className="w-full" render={<Link href={routes.student.dashboard} />}>
                Student dashboard
              </Button>
              <Button variant="outline" className="w-full" render={<Link href={routes.join} />}>
                Join with invite code
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
