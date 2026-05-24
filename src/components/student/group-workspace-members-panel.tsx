import { Crown } from "lucide-react";
import type { StudentGroupWorkspaceData } from "@/app/actions/groups";
import { stitch } from "@/lib/design/stitch";
import { cn } from "@/lib/utils";

interface GroupWorkspaceMembersPanelProps {
  group: NonNullable<StudentGroupWorkspaceData["group"]>;
}

export function GroupWorkspaceMembersPanel({
  group,
}: GroupWorkspaceMembersPanelProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-stitch-text-secondary">
        Group leader is highlighted. Skill averages come from onboarding.
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {group.members.map((member) => (
          <li
            key={member.id}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2.5",
              member.isLeader
                ? "border border-stitch-primary/20 bg-stitch-accent-soft"
                : "bg-stitch-accent-soft"
            )}
          >
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-stitch-accent-muted text-xs font-semibold text-stitch-nav-active">
                {member.initials}
              </span>
              <div>
                <p className="text-sm font-medium text-stitch-text">
                  {member.name}
                  {member.isLeader && (
                    <span className="ml-1 text-xs text-stitch-primary">
                      (Leader)
                    </span>
                  )}
                </p>
                {member.averageSkill !== null && (
                  <p className="text-xs text-stitch-text-muted">
                    Skills {member.averageSkill} / 5
                  </p>
                )}
              </div>
            </div>
            {member.isLeader && (
              <Crown
                className="size-4 shrink-0 text-stitch-primary"
                aria-label="Group leader"
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
