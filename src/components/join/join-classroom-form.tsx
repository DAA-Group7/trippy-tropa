"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getClassroomByInviteCode } from "@/app/actions/join-classroom";
import { parseInviteCodeFromInput } from "@/lib/invite";
import { routes } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-lg border border-[#c3c6d7] bg-white px-4 py-2.5 text-base text-[#191b23] focus:border-[#004ac6] focus:outline-none focus:ring-1 focus:ring-[#004ac6]";

interface JoinClassroomFormProps {
  initialCode?: string;
}

export function JoinClassroomForm({ initialCode }: JoinClassroomFormProps) {
  const router = useRouter();
  const [input, setInput] = useState(initialCode ?? "");
  const [preview, setPreview] = useState<{
    id: string;
    name: string;
    subject: string | null;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!initialCode) return;
    startTransition(async () => {
      const classroom = await getClassroomByInviteCode(initialCode);
      if (classroom) {
        setPreview({ id: classroom.id, name: classroom.name, subject: classroom.subject });
      }
    });
  }, [initialCode]);

  const lookupClassroom = () => {
    const code = parseInviteCodeFromInput(input);
    if (!code) {
      toast.error("Enter a valid invite link or code");
      return;
    }

    startTransition(async () => {
      const classroom = await getClassroomByInviteCode(code);
      if (!classroom) {
        setPreview(null);
        toast.error("Classroom not found. Check the link with your teacher.");
        return;
      }
      setPreview({
        id: classroom.id,
        name: classroom.name,
        subject: classroom.subject,
      });
      toast.success(`Found: ${classroom.name}`);
    });
  };

  const handleJoin = () => {
    if (!preview) {
      lookupClassroom();
      return;
    }
    // TODO: enroll member in classroom_members when auth is wired
    router.push(routes.onboarding);
  };

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-8 text-center sm:text-left">
        <h1 className="font-serif text-3xl font-bold text-[#191b23] sm:text-4xl">
          Join a classroom
        </h1>
        <p className="mt-2 text-[#434655]">
          Paste the invite link from your teacher or enter the short code.
        </p>
      </div>

      <div className="rounded-xl border border-[#c3c6d7] bg-white p-6 shadow-sm">
        <label
          htmlFor="invite"
          className="mb-1 block text-sm font-medium text-[#434655]"
        >
          Invite link or code
        </label>
        <input
          id="invite"
          className={inputClass}
          placeholder="https://…/join/c/9x2a-b4zq or 9x2a-b4zq"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && lookupClassroom()}
        />

        {preview && (
          <div className="mt-4 rounded-lg border border-[#004ac6]/20 bg-[#dbe1ff]/40 p-4">
            <p className="text-sm font-medium text-[#004ac6]">Classroom found</p>
            <p className="mt-1 text-lg font-semibold text-[#191b23]">{preview.name}</p>
            {preview.subject && (
              <p className="text-sm text-[#505f76]">{preview.subject}</p>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={isPending}
            onClick={lookupClassroom}
            className={cn(
              "flex-1 rounded-lg border border-[#c3c6d7] px-4 py-2.5 text-sm font-medium text-[#434655] hover:bg-[#f3f3fe] disabled:opacity-60"
            )}
          >
            {isPending ? "Looking up…" : "Verify invite"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleJoin}
            className="flex-1 rounded-lg bg-[#2563eb] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#004ac6] disabled:opacity-60"
          >
            Join classroom
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-[#505f76]">
          <Link href={routes.login} className="font-medium text-[#004ac6]">
            Sign in
          </Link>{" "}
          or{" "}
          <Link href={routes.register} className="font-medium text-[#004ac6]">
            register
          </Link>{" "}
          to save your enrollment.
        </p>
      </div>
    </div>
  );
}
