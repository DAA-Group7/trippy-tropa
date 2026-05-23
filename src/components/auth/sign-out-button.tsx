"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

interface SignOutButtonProps {
  className?: string;
  variant?: "sidebar" | "compact";
}

export function SignOutButton({
  className,
  variant = "sidebar",
}: SignOutButtonProps) {
  if (variant === "compact") {
    return (
      <form action={signOut}>
        <button
          type="submit"
          className={cn(
            "rounded-lg p-2 text-[#505f76] transition-colors hover:bg-[#e7e7f3] hover:text-[#004ac6]",
            className
          )}
          aria-label="Sign out"
        >
          <LogOut className="size-5" />
        </button>
      </form>
    );
  }

  return (
    <form action={signOut} className={cn("w-full", className)}>
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-lg border border-[#c3c6d7] px-3 py-2.5 text-sm font-medium text-[#505f76] transition-colors hover:border-[#004ac6]/30 hover:bg-[#f3f3fe] hover:text-[#004ac6]"
      >
        <LogOut className="size-4 shrink-0" />
        Sign out
      </button>
    </form>
  );
}
