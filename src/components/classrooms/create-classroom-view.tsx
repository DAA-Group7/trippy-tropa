"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle2,
  Copy,
  Link2,
  Mail,
  MessageSquare,
  QrCode,
  QrCodeIcon,
} from "lucide-react";
import { toast } from "sonner";
import { createClassroom } from "@/app/actions/classrooms";
import { routes } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

const SUBJECTS = [
  { value: "", label: "Select an academic discipline" },
  { value: "sciences", label: "Natural Sciences" },
  { value: "humanities", label: "Humanities" },
  { value: "engineering", label: "Engineering" },
  { value: "mathematics", label: "Mathematics" },
  { value: "computer-science", label: "Computer Science" },
  { value: "business", label: "Business & Management" },
  { value: "other", label: "Other" },
];

const inputClass =
  "w-full rounded-lg border border-[#c3c6d7] bg-[#faf8ff] px-4 py-2.5 text-base text-[#191b23] transition-colors placeholder:text-[#737686] focus:border-[#004ac6] focus:outline-none focus:ring-1 focus:ring-[#004ac6]";

const cardClass =
  "relative overflow-hidden rounded-xl border border-[#c3c6d7] bg-white p-6 shadow-sm";

export function CreateClassroomView() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [maxGroups, setMaxGroups] = useState("5");
  const [rules, setRules] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [classroomId, setClassroomId] = useState<string | null>(null);

  const copyToClipboard = async (text: string, message: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(message);
  };

  const handleFinalize = async () => {
    if (!name.trim()) {
      toast.error("Please enter a class name");
      return;
    }

    setIsSubmitting(true);
    const result = await createClassroom({
      name: name.trim(),
      subject: subject || undefined,
      maxGroups: Number(maxGroups) || 5,
      rules: rules.trim() || undefined,
    });
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setInviteUrl(result.inviteUrl);
    setInviteCode(result.inviteCode);
    setClassroomId(result.classroomId);
    setShowQr(true);
    toast.success("Classroom created — share the invite link with students");
  };

  const messengerMessage = inviteUrl
    ? `Join our class on Trippy-Tropa:\n${inviteUrl}`
    : "";

  return (
    <div className="mx-auto w-full max-w-[1280px]">
      <div className="mb-6 sm:mb-8">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-[#191b23] sm:text-5xl">
          Create Classroom
        </h1>
        <p className="mt-3 max-w-[720px] text-lg text-[#434655]">
          Establish a new academic space for structured learning, collaboration,
          and resource distribution.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-6">
        {/* Left: form */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          <div className={cardClass}>
            <div className="absolute left-0 top-0 h-1 w-full bg-[#004ac6]" />
            <h2 className="mb-4 text-xl font-semibold text-[#191b23]">
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
                  className={inputClass}
                  placeholder="e.g., Advanced Physics 301"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                  className={cn(inputClass, "appearance-none")}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  {SUBJECTS.map((s) => (
                    <option key={s.value} value={s.value} disabled={!s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <h2 className="mb-4 text-xl font-semibold text-[#191b23]">
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
                  className={cn(inputClass, "md:max-w-xs")}
                  placeholder="e.g., 5"
                  value={maxGroups}
                  onChange={(e) => setMaxGroups(e.target.value)}
                />
                <p className="mt-1 text-sm text-[#505f76]">
                  Limit the number of sub-groups allowed for collaborative
                  projects.
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
                  rows={4}
                  className={cn(inputClass, "resize-none")}
                  placeholder="Outline specific expectations, syllabus notes, or behavioral guidelines..."
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link
              href={routes.officer.dashboard}
              className="rounded-lg border border-[#c3c6d7] px-6 py-2.5 text-sm font-medium text-[#434655] transition-colors hover:bg-[#e7e7f3]"
            >
              Cancel
            </Link>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleFinalize()}
              className="flex items-center gap-2 rounded-lg bg-[#2563eb] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#004ac6] disabled:opacity-60"
            >
              <CheckCircle2 className="size-[18px]" />
              {isSubmitting ? "Creating…" : "Finalize Classroom"}
            </button>
          </div>
        </div>

        {/* Right: sharing */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          <div className={cardClass}>
            <div className="mb-2 flex items-center gap-2">
              <Link2 className="size-5 text-[#004ac6]" />
              <h3 className="text-xl font-semibold text-[#191b23]">
                Secure Invite Link
              </h3>
            </div>
            <p className="mb-3 text-sm text-[#505f76]">
              Share this link with students. They sign in (or register), complete
              skill assessment if new, then join automatically.
            </p>
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
                  inviteUrl ??
                  "Finalize classroom to generate your student join link"
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

          <div className={cn(cardClass, "flex flex-col items-center")}>
            <h3 className="w-full text-left text-xl font-semibold text-[#191b23]">
              Generate Access QR
            </h3>
            <p className="mb-4 w-full text-left text-sm text-[#505f76]">
              Project this code in the lecture hall for instant onboarding.
            </p>
            <div className="relative flex size-48 items-center justify-center overflow-hidden rounded-lg border border-[#c3c6d7] bg-[#f3f3fe] shadow-inner">
              {showQr && inviteUrl ? (
                <QRCodeSVG value={inviteUrl} size={176} level="M" />
              ) : (
                <QrCodeIcon className="size-16 text-[#c3c6d7]" />
              )}
            </div>
            <button
              type="button"
              disabled={!inviteUrl}
              onClick={() => setShowQr(true)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#d0e1fb] px-6 py-2.5 text-sm font-medium text-[#54647a] transition-colors hover:bg-[#505f76] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <QrCode className="size-[18px]" />
              {inviteUrl ? "Show QR Code" : "Generate QR Code"}
            </button>
          </div>

          <div className={cardClass}>
            <h3 className="text-xl font-semibold text-[#191b23]">
              External Distribution
            </h3>
            <p className="mb-4 text-sm text-[#505f76]">
              Send invitations via integrated institutional channels.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={!inviteUrl}
                onClick={() =>
                  inviteUrl &&
                  void copyToClipboard(
                    `Subject: Join our class\n\n${inviteUrl}`,
                    "Email draft copied to clipboard"
                  )
                }
                className="flex flex-col items-center justify-center gap-2 rounded-lg border border-[#c3c6d7] bg-[#faf8ff] py-4 transition-colors hover:bg-[#e7e7f3] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Mail className="size-6 text-[#004ac6]" />
                <span className="text-xs font-semibold uppercase tracking-wide text-[#191b23]">
                  Institutional Email
                </span>
              </button>
              <button
                type="button"
                disabled={!messengerMessage}
                onClick={() =>
                  void copyToClipboard(
                    messengerMessage,
                    "Messenger-ready message copied"
                  )
                }
                className="flex flex-col items-center justify-center gap-2 rounded-lg border border-[#c3c6d7] bg-[#faf8ff] py-4 transition-colors hover:bg-[#e7e7f3] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <MessageSquare className="size-6 text-[#004ac6]" />
                <span className="text-xs font-semibold uppercase tracking-wide text-[#191b23]">
                  Messenger Group
                </span>
              </button>
            </div>
          </div>

          {classroomId && (
            <button
              type="button"
              onClick={() =>
                router.push(routes.officer.classroom(classroomId))
              }
              className="w-full rounded-lg border border-[#004ac6] bg-white py-3 text-sm font-medium text-[#004ac6] transition-colors hover:bg-[#dbe1ff]"
            >
              View classroom details →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
