/** Distinct hues for assignees in the officer assignment heatmap. */
export const ASSIGNEE_PALETTE = [
  "#2563eb",
  "#059669",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#db2777",
  "#0891b2",
  "#65a30d",
] as const;

export function assigneeColorForIndex(index: number): string {
  return ASSIGNEE_PALETTE[index % ASSIGNEE_PALETTE.length];
}

/** Background fill opacity from skill match score (0–100). */
export function matchScoreOpacity(matchScore: number): number {
  const clamped = Math.min(100, Math.max(0, matchScore));
  return 0.22 + (clamped / 100) * 0.55;
}

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
