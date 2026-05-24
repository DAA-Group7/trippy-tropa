"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Link2, QrCodeIcon, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createClassroom } from "@/app/actions/classrooms";
import { ClassroomInviteQr } from "@/components/classrooms/classroom-invite-qr";
import {
  CREATE_CLASSROOM_SUBJECTS,
  createClassroomCardClass,
  createClassroomInputClass,
} from "@/lib/constants/create-classroom";
import { routes } from "@/lib/constants/routes";
import { createLogger } from "@/lib/logger";
import { cn } from "@/lib/utils";

const log = createLogger("classroom:ui");

export type CreateClassroomFormSuccess = {
  classroomId: string;
  inviteCode: string;
  inviteUrl: string;
  name: string;
};

export interface CreateClassroomFormProps {
  variant: "page" | "sheet";
  onCancel?: () => void;
  onSuccess?: (result: CreateClassroomFormSuccess) => void;
}

export function CreateClassroomForm({
  variant,
  onCancel,
  onSuccess,
}: CreateClassroomFormProps) {
  const router = useRouter();
  const isSheet = variant === "sheet";

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [maxGroups, setMaxGroups] = useState("5");
  const [rules, setRules] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [classroomId, setClassroomId] = useState<string | null>(null);

  const canGenerate = Boolean(name.trim()) && !isSubmitting;
  const isGenerated = Boolean(inviteUrl);

  const copyToClipboard = async (text: string, message: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(message);
  };

  const handleGenerateInviteLink = async () => {
    if (!name.trim()) {
      toast.error("Please enter a class name first");
      return;
    }

    if (isGenerated) {
      await copyToClipboard(inviteUrl!, "Invite link copied");
      return;
    }

    setIsSubmitting(true);
    log.info("generate_invite_attempt", { name: name.trim(), variant });
    const result = await createClassroom({
      name: name.trim(),
      subject: subject || undefined,
      maxGroups: Number(maxGroups) || 5,
      rules: rules.trim() || undefined,
    });
    setIsSubmitting(false);

    if (!result.success) {
      log.warn("generate_invite_failed", { error: result.error });
      toast.error(result.error);
      return;
    }

    log.info("generate_invite_success", {
      classroomId: result.classroomId,
      variant,
    });
    setInviteUrl(result.inviteUrl);
    setInviteCode(result.inviteCode);
    setClassroomId(result.classroomId);
    toast.success("Invite link ready — share it with your students");

    onSuccess?.({
      classroomId: result.classroomId,
      inviteCode: result.inviteCode,
      inviteUrl: result.inviteUrl,
      name: name.trim(),
    });
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }
    router.push(routes.officer.dashboard);
  };

  const identifiersCard = (
    <div className={createClassroomCardClass}>
      <div className="absolute left-0 top-0 h-1 w-full bg-[#004ac6]" />
      <h2
        className={cn(
          "mb-4 font-semibold text-[#191b23]",
          isSheet ? "text-lg" : "text-xl"
        )}
      >
        Classroom Identifiers
      </h2>
      <div className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="class-name"
            className="mb-1 block text-sm font-medium text-[#434655]"
          >
            Class Name
          </label>
          <input
            id="class-name"
            className={createClassroomInputClass}
            placeholder="e.g., Advanced Physics 301"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isGenerated}
          />
        </div>
        <div>
          <label
            htmlFor="subject"
            className="mb-1 block text-sm font-medium text-[#434655]"
          >
            Subject Area
          </label>
          <select
            id="subject"
            className={cn(createClassroomInputClass, "appearance-none")}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={isGenerated}
          >
            {CREATE_CLASSROOM_SUBJECTS.map((s) => (
              <option key={s.value} value={s.value} disabled={!s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const configCard = (
    <div className={createClassroomCardClass}>
      <h2
        className={cn(
          "mb-4 font-semibold text-[#191b23]",
          isSheet ? "text-lg" : "text-xl"
        )}
      >
        Configuration &amp; Rules
      </h2>
      <div className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="max-groups"
            className="mb-1 block text-sm font-medium text-[#434655]"
          >
            Maximum Collaborative Groups
          </label>
          <input
            id="max-groups"
            type="number"
            min={1}
            max={20}
            className={cn(createClassroomInputClass, !isSheet && "md:max-w-xs")}
            placeholder="e.g., 5"
            value={maxGroups}
            onChange={(e) => setMaxGroups(e.target.value)}
            disabled={isGenerated}
          />
          <p className="mt-1 text-sm text-[#505f76]">
            Limit the number of sub-groups allowed for collaborative projects.
          </p>
        </div>
        <div>
          <label
            htmlFor="rules"
            className="mb-1 block text-sm font-medium text-[#434655]"
          >
            Classroom Guidelines
          </label>
          <textarea
            id="rules"
            rows={isSheet ? 3 : 4}
            className={cn(createClassroomInputClass, "resize-none")}
            placeholder="Outline specific expectations, syllabus notes, or behavioral guidelines..."
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            disabled={isGenerated}
          />
        </div>
      </div>
    </div>
  );

  const inviteCard = (
    <div className={createClassroomCardClass}>
      <div className="absolute left-0 top-0 h-1 w-full bg-[#004ac6]" />
      <div className="mb-2 flex items-center gap-2">
        <Link2 className="size-5 text-[#004ac6]" />
        <h3
          className={cn(
            "font-semibold text-[#191b23]",
            isSheet ? "text-lg" : "text-xl"
          )}
        >
          Secure Invite Link
        </h3>
      </div>
      <p className="mb-4 text-sm text-[#505f76]">
        {isGenerated
          ? "Share this link with students. They sign in, complete skill assessment if new, then join automatically."
          : isSheet
            ? "Complete the form above, then generate your student join link."
            : "Fill in the classroom details on the left, then generate your student join link below."}
      </p>

      <button
        type="button"
        disabled={!canGenerate && !isGenerated}
        onClick={() => void handleGenerateInviteLink()}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#004ac6] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Sparkles className="size-[18px]" />
        {isSubmitting
          ? "Generating…"
          : isGenerated
            ? "Copy invite link"
            : "Generate invite link"}
      </button>

      <div
        className={cn(
          "flex overflow-hidden rounded-lg border border-[#c3c6d7] transition-all focus-within:border-[#004ac6] focus-within:ring-1 focus-within:ring-[#004ac6]",
          !inviteUrl && "opacity-70"
        )}
      >
        <input
          readOnly
          type="text"
          className="min-w-0 flex-1 truncate border-0 bg-[#faf8ff] px-4 py-2.5 text-sm text-[#434655] focus:outline-none"
          value={
            inviteUrl ?? "Your join link will appear here after you generate it"
          }
        />
        <button
          type="button"
          disabled={!inviteUrl}
          onClick={() =>
            inviteUrl && void copyToClipboard(inviteUrl, "Invite link copied")
          }
          className="flex shrink-0 items-center gap-1 border-l border-[#c3c6d7] bg-[#e7e7f3] px-4 py-2.5 text-sm font-medium text-[#191b23] transition-colors hover:bg-[#e1e2ed] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Copy className="size-[18px]" />
          Copy
        </button>
      </div>
      {inviteCode && (
        <p className="mt-2 text-xs text-[#505f76]">
          Invite code:{" "}
          <span className="font-mono font-medium text-[#004ac6]">
            {inviteCode}
          </span>
        </p>
      )}
    </div>
  );

  const qrCard = (
    <div className={cn(createClassroomCardClass, "flex flex-col items-center")}>
      <h3
        className={cn(
          "w-full text-left font-semibold text-[#191b23]",
          isSheet ? "text-lg" : "text-xl"
        )}
      >
        Access QR Code
      </h3>
      <p className="mb-4 w-full text-left text-sm text-[#505f76]">
        {inviteUrl
          ? "Download or copy the QR image for slides, posters, or printed handouts."
          : "Generate your invite link first to create the classroom QR code."}
      </p>
      {inviteUrl && inviteCode ? (
        <ClassroomInviteQr
          inviteUrl={inviteUrl}
          inviteCode={inviteCode}
          classroomName={name.trim() || undefined}
        />
      ) : (
        <div
          className={cn(
            "flex items-center justify-center rounded-lg border border-dashed border-[#c3c6d7] bg-[#f3f3fe]",
            isSheet ? "size-40" : "size-48"
          )}
        >
          <QrCodeIcon
            className={cn("text-[#c3c6d7]", isSheet ? "size-12" : "size-16")}
          />
        </div>
      )}
    </div>
  );

  const footerActions = (
    <div
      className={cn(
        "flex gap-3",
        isSheet ? "flex-col-reverse sm:flex-row sm:justify-end" : "justify-end"
      )}
    >
      <button
        type="button"
        onClick={handleCancel}
        className="rounded-lg border border-[#c3c6d7] px-6 py-2.5 text-sm font-medium text-[#434655] transition-colors hover:bg-[#e7e7f3]"
      >
        {isGenerated ? "Close" : "Cancel"}
      </button>
      {isSheet && !isGenerated && (
        <Link
          href={routes.officer.createClassroom}
          className="text-center text-sm font-medium text-[#004ac6] hover:underline sm:mr-auto sm:self-center"
        >
          Open full-page form
        </Link>
      )}
      {isSheet && classroomId && (
        <button
          type="button"
          onClick={() => router.push(routes.officer.classroom(classroomId))}
          className="rounded-lg border border-[#004ac6] bg-white px-6 py-2.5 text-sm font-medium text-[#004ac6] transition-colors hover:bg-[#dbe1ff]"
        >
          View classroom details →
        </button>
      )}
    </div>
  );

  if (isSheet) {
    return (
      <div className="flex flex-col gap-6 overflow-y-auto px-4 pb-8">
        {identifiersCard}
        {configCard}
        {inviteCard}
        {qrCard}
        {footerActions}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-6">
      <div className="flex flex-col gap-6 lg:col-span-7">
        {identifiersCard}
        {configCard}
        {footerActions}
      </div>
      <div className="flex flex-col gap-6 lg:col-span-5">
        {inviteCard}
        {qrCard}
        {classroomId && (
          <button
            type="button"
            onClick={() => router.push(routes.officer.classroom(classroomId))}
            className="w-full rounded-lg border border-[#004ac6] bg-white py-3 text-sm font-medium text-[#004ac6] transition-colors hover:bg-[#dbe1ff]"
          >
            View classroom details →
          </button>
        )}
      </div>
    </div>
  );
}
