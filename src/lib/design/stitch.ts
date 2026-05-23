/**
 * Trippy-Tropa Stitch design tokens — use instead of scattered hex literals.
 * @see .interface-design/system.md
 */

export const stitchColors = {
  primary: "#004ac6",
  primaryCta: "#2563eb",
  canvas: "#faf8ff",
  surface: "#ffffff",
  border: "#c3c6d7",
  text: "#191b23",
  textSecondary: "#434655",
  textMuted: "#505f76",
  textNav: "#737686",
  accentSoft: "#f3f3fe",
  accentMuted: "#e7e7f3",
  accentBlue: "#dbe1ff",
  accentBlueMid: "#d0e1fb",
  navActive: "#54647a",
  destructive: "#ba1a1a",
} as const;

/** Tailwind class fragments (stitch-* from globals.css @theme) */
export const stitch = {
  canvas: "bg-stitch-canvas text-stitch-text",
  surface: "bg-stitch-surface",
  border: "border-stitch-border",
  text: "text-stitch-text",
  textSecondary: "text-stitch-text-secondary",
  textMuted: "text-stitch-text-muted",
  primary: "text-stitch-primary",
  link: "text-stitch-primary hover:underline",
  btnPrimary:
    "rounded-lg bg-stitch-cta px-4 py-2 text-sm font-medium text-white hover:bg-stitch-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stitch-primary focus-visible:ring-offset-2",
  btnSecondary:
    "rounded-lg border border-stitch-border px-4 py-2 text-sm font-medium text-stitch-primary hover:bg-stitch-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stitch-primary focus-visible:ring-offset-2",
  navActive:
    "border-r-4 border-stitch-primary bg-stitch-accent-soft font-bold text-stitch-primary",
  navIdle:
    "text-stitch-text-muted hover:bg-stitch-accent-muted hover:text-stitch-primary",
  card: "rounded-xl border border-stitch-border bg-stitch-surface",
  cardShadow:
    "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]",
  input:
    "rounded-lg border border-stitch-border bg-stitch-accent-soft text-sm text-stitch-text placeholder:text-stitch-text-nav focus:border-stitch-primary focus:outline-none focus:ring-2 focus:ring-stitch-primary/20",
  progressTrack: "bg-stitch-accent-muted",
  progressFill: "bg-stitch-primary",
} as const;

export const classroomHeaderGradients = [
  "from-[#004ac6] to-[#2563eb]",
  "from-[#505f76] to-[#004ac6]",
  "from-[#2563eb] to-[#54647a]",
] as const;
