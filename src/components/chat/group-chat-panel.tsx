"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import {
  sendGroupMessage,
  type GroupMessageItem,
} from "@/app/actions/messages";
import { useGroupMessagesRealtime } from "@/hooks/use-group-messages-realtime";
import { stitch } from "@/lib/design/stitch";
import { cn } from "@/lib/utils";

interface GroupChatPanelProps {
  groupId: string;
  initialMessages: GroupMessageItem[];
}

export function GroupChatPanel({
  groupId,
  initialMessages,
}: GroupChatPanelProps) {
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);
  const { messages, setMessages } = useGroupMessagesRealtime(
    groupId,
    initialMessages
  );

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || isPending) return;

    startTransition(async () => {
      const result = await sendGroupMessage({ groupId, body });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setDraft("");
    });
  };

  return (
    <section aria-labelledby="group-chat-heading" className="flex flex-col">
      <h3
        id="group-chat-heading"
        className="mb-1 text-lg font-semibold text-stitch-text"
      >
        Discussion
      </h3>
      <p className="mb-3 text-sm text-stitch-text-secondary">
        Messages sync in real time for everyone in your group.
      </p>

      <div
        ref={listRef}
        className={cn(
          "mb-3 flex max-h-64 min-h-[12rem] flex-col gap-3 overflow-y-auto rounded-lg border border-stitch-border bg-stitch-canvas p-3",
          stitch.cardShadow
        )}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Group chat messages"
      >
        {messages.length === 0 ? (
          <p className="m-auto text-center text-sm text-stitch-text-muted">
            Start the conversation — say hello to your team.
          </p>
        ) : (
          messages.map((msg) => (
            <article
              key={msg.id}
              className={cn(
                "flex gap-2",
                msg.isOwn ? "flex-row-reverse" : "flex-row"
              )}
            >
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-stitch-accent-muted text-xs font-semibold text-stitch-nav-active"
                aria-hidden
              >
                {msg.authorInitials}
              </span>
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-3 py-2",
                  msg.isOwn
                    ? "bg-stitch-primary text-white"
                    : "border border-stitch-border bg-stitch-surface"
                )}
              >
                {!msg.isOwn && (
                  <p className="mb-0.5 text-xs font-semibold text-stitch-primary">
                    {msg.authorName}
                  </p>
                )}
                <p
                  className={cn(
                    "text-sm leading-snug",
                    msg.isOwn ? "text-white" : "text-stitch-text"
                  )}
                >
                  {msg.body}
                </p>
                <time
                  dateTime={msg.createdAt}
                  className={cn(
                    "mt-1 block text-[10px]",
                    msg.isOwn ? "text-white/80" : "text-stitch-text-muted"
                  )}
                >
                  {msg.timeAgo}
                </time>
              </div>
            </article>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="group-chat-input" className="sr-only">
          Message your group
        </label>
        <input
          id="group-chat-input"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message…"
          disabled={isPending}
          maxLength={2000}
          autoComplete="off"
          className={cn("min-w-0 flex-1", stitch.input)}
        />
        <button
          type="submit"
          disabled={isPending || !draft.trim()}
          className={cn(stitch.btnPrimary, "inline-flex items-center gap-1 px-3")}
          aria-label="Send message"
        >
          <Send className="size-4" aria-hidden />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </section>
  );
}
