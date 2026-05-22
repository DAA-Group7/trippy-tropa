import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants/brand";
import { cn } from "@/lib/utils";

type BrandMarkSize = "sm" | "md" | "lg";

const sizeConfig = {
  sm: {
    icon: "size-4",
    box: "size-8 rounded-lg",
    title: "text-sm font-semibold tracking-tight",
    tagline: "text-[10px] leading-tight",
  },
  md: {
    icon: "size-5",
    box: "size-10 rounded-xl",
    title: "text-lg font-semibold tracking-tight",
    tagline: "text-xs",
  },
  lg: {
    icon: "size-6",
    box: "size-12 rounded-xl",
    title: "text-xl font-bold tracking-tight",
    tagline: "text-sm",
  },
} as const;

interface BrandMarkProps {
  size?: BrandMarkSize;
  showTagline?: boolean;
  href?: string;
  className?: string;
  /** Sidebar / compact: title only, no tagline unless showTagline */
  variant?: "default" | "header";
}

export function BrandMark({
  size = "md",
  showTagline = true,
  href,
  className,
  variant = "default",
}: BrandMarkProps) {
  const s = sizeConfig[size];
  const content = (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center bg-[#004ac6] text-white shadow-sm",
          s.box
        )}
      >
        <GraduationCap className={s.icon} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className={cn(s.title, "text-[#004ac6]")}>{APP_NAME}</p>
        {showTagline && variant === "default" && (
          <p className={cn(s.tagline, "text-[#505f76]")}>{APP_TAGLINE}</p>
        )}
        {showTagline && variant === "header" && (
          <p className={cn(s.tagline, "text-[#434655]")}>{APP_TAGLINE}</p>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}

/** Single-line brand for mobile headers and compact bars */
export function BrandTitle({
  className,
  asLink,
  href = "/",
}: {
  className?: string;
  asLink?: boolean;
  href?: string;
}) {
  const el = (
    <span
      className={cn(
        "font-semibold tracking-tight text-[#004ac6]",
        className
      )}
    >
      {APP_NAME}
    </span>
  );

  if (asLink) {
    return <Link href={href}>{el}</Link>;
  }

  return el;
}
