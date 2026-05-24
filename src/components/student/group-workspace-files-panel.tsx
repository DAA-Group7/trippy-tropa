import { FolderOpen } from "lucide-react";
import { stitch } from "@/lib/design/stitch";
import { cn } from "@/lib/utils";

export function GroupWorkspaceFilesPanel() {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-stitch-border bg-stitch-accent-soft/40 px-6 py-16 text-center",
        stitch.cardShadow
      )}
    >
      <FolderOpen
        className="mb-4 size-12 text-stitch-border"
        aria-hidden
      />
      <p className="text-lg font-medium text-stitch-text">Shared files</p>
      <p className="mt-2 max-w-md text-sm text-stitch-text-muted">
        Upload and download group files will be available in a future update.
      </p>
    </div>
  );
}
