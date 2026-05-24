import Link from "next/link";
import {
  ClipboardList,
  Layers,
  UserPlus,
  Wand2,
} from "lucide-react";
import type { ClassroomActivityItem } from "@/app/actions/activity";
import type { ActivityFeedIcon } from "@/lib/activity/helpers";
import { routes } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

const cardShadow =
  "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]";

function ActivityIcon({ type }: { type: ActivityFeedIcon }) {
  const config = {
    enroll: {
      icon: UserPlus,
      bg: "bg-[#dbe1ff]",
      text: "text-[#004ac6]",
    },
    groups: {
      icon: Layers,
      bg: "bg-[#d3e4fe]",
      text: "text-[#505f76]",
    },
    task: {
      icon: ClipboardList,
      bg: "bg-[#d0e1fb]",
      text: "text-[#004ac6]",
    },
    assign: {
      icon: Wand2,
      bg: "bg-[#e8f5e9]",
      text: "text-[#2e7d32]",
    },
  }[type];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full p-1.5",
        config.bg,
        config.text
      )}
    >
      <Icon className="size-4" aria-hidden />
    </span>
  );
}

interface ClassroomActivityFeedProps {
  items: ClassroomActivityItem[];
}

export function ClassroomActivityFeed({ items }: ClassroomActivityFeedProps) {
  return (
    <section
      className="mb-10"
      aria-labelledby="officer-activity-feed-heading"
    >
      <h3
        id="officer-activity-feed-heading"
        className="mb-4 text-xl font-semibold text-[#191b23]"
      >
        Recent activity
      </h3>
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-[#c3c6d7] bg-white",
          cardShadow
        )}
      >
        {items.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-[#505f76]">
            Activity from enrollments, group publishes, and tasks will appear
            here.
          </p>
        ) : (
          <ul className="divide-y divide-[#e7e7f3]">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={routes.officer.classroom(item.classroomId)}
                  className="flex gap-3 px-4 py-3 transition-colors hover:bg-[#faf8ff] sm:px-6 sm:py-4"
                >
                  <ActivityIcon type={item.icon} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#191b23]">
                      {item.summary}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[#505f76]">
                      {item.classroomName}
                      <span className="mx-1.5 text-[#c3c6d7]">·</span>
                      {item.timeAgo}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
