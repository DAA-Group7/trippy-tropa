const MS_PER_DAY = 86_400_000;

export type ActivityTrendPoint = {
  dateKey: string;
  label: string;
  taskUpdates: number;
  messages: number;
};

export function last7DayKeys(reference = new Date()): string[] {
  const keys: string[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(reference);
    d.setUTCDate(d.getUTCDate() - i);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

export function isoToUtcDateKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export function buildActivityTrend(
  taskUpdateDates: string[],
  messageDates: string[]
): ActivityTrendPoint[] {
  const keys = last7DayKeys();
  const taskByDay = new Map<string, number>();
  const msgByDay = new Map<string, number>();

  for (const iso of taskUpdateDates) {
    const key = isoToUtcDateKey(iso);
    if (!keys.includes(key)) continue;
    taskByDay.set(key, (taskByDay.get(key) ?? 0) + 1);
  }

  for (const iso of messageDates) {
    const key = isoToUtcDateKey(iso);
    if (!keys.includes(key)) continue;
    msgByDay.set(key, (msgByDay.get(key) ?? 0) + 1);
  }

  return keys.map((dateKey) => ({
    dateKey,
    label: new Date(`${dateKey}T12:00:00Z`).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
    taskUpdates: taskByDay.get(dateKey) ?? 0,
    messages: msgByDay.get(dateKey) ?? 0,
  }));
}

export function maxIso(dates: (string | null | undefined)[]): string | null {
  let best: string | null = null;
  let bestMs = 0;
  for (const iso of dates) {
    if (!iso) continue;
    const ms = new Date(iso).getTime();
    if (!Number.isFinite(ms)) continue;
    if (ms > bestMs) {
      bestMs = ms;
      best = iso;
    }
  }
  return best;
}

export function isOlderThanDays(iso: string | null, days: number): boolean {
  if (!iso) return true;
  const ms = new Date(iso).getTime();
  if (!Number.isFinite(ms)) return true;
  return Date.now() - ms > days * MS_PER_DAY;
}

export function formatLastActive(iso: string | null): string {
  if (!iso) return "No activity yet";
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) {
    const m = Math.floor(diffSec / 60);
    return `${m}m ago`;
  }
  if (diffSec < 86400) {
    const h = Math.floor(diffSec / 3600);
    return `${h}h ago`;
  }
  const d = Math.floor(diffSec / 86400);
  return `${d}d ago`;
}
