import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { APP_NAME, routes } from "@/lib/constants/routes";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/50 px-4 py-12">
      <Link
        href={routes.home}
        className="mb-8 flex items-center gap-2 text-foreground"
      >
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <GraduationCap className="size-5" />
        </div>
        <span className="text-lg font-semibold">{APP_NAME}</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
