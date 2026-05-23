import Link from "next/link";
import { DoorOpen } from "lucide-react";
import { BrandTitle } from "@/components/brand/brand-mark";
import { routes } from "@/lib/constants/routes";

export function JoinInviteNotFound({ code }: { code: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf8ff]">
      <header className="flex h-16 items-center border-b border-[#c3c6d7] bg-white px-4 md:px-6">
        <BrandTitle className="text-lg" />
      </header>
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="mx-auto w-full max-w-md rounded-xl border border-[#c3c6d7] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-[#ffdad6]">
            <DoorOpen className="size-8 text-[#ba1a1a]" />
          </div>
          <h1 className="text-xl font-semibold text-[#191b23]">
            Invite link not found
          </h1>
          <p className="mt-2 text-sm text-[#434655]">
            No classroom matches <span className="font-mono">{code}</span>.
            Ask your instructor for an updated link.
          </p>
          <Link
            href={routes.join}
            className="mt-6 inline-block text-sm font-medium text-[#004ac6] hover:underline"
          >
            Enter a code manually
          </Link>
        </div>
      </main>
    </div>
  );
}
