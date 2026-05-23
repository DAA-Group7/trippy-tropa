import { stitch } from "@/lib/design/stitch";

interface SkipToContentProps {
  targetId?: string;
}

export function SkipToContent({ targetId = "main-content" }: SkipToContentProps) {
  return (
    <a
      href={`#${targetId}`}
      className={`sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] ${stitch.btnPrimary}`}
    >
      Skip to main content
    </a>
  );
}
