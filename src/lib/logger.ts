type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function resolveMinLevel(): LogLevel {
  const fromEnv =
    process.env.LOG_LEVEL ?? process.env.NEXT_PUBLIC_LOG_LEVEL ?? "";
  const normalized = fromEnv.toLowerCase();
  if (
    normalized === "debug" ||
    normalized === "info" ||
    normalized === "warn" ||
    normalized === "error"
  ) {
    return normalized;
  }
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

const minLevel = resolveMinLevel();

function shouldLog(level: LogLevel): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[minLevel];
}

function serialize(data: unknown): string {
  if (data === undefined) return "";
  try {
    return ` ${JSON.stringify(data)}`;
  } catch {
    return " [unserializable]";
  }
}

export function maskEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf("@");
  if (at <= 0) return "***";
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const maskedLocal =
    local.length <= 1 ? "*" : `${local[0]}${"*".repeat(Math.min(local.length - 1, 3))}`;
  return `${maskedLocal}@${domain}`;
}

export function maskUserId(id: string | undefined | null): string | undefined {
  if (!id) return undefined;
  if (id.length <= 8) return id;
  return `${id.slice(0, 8)}…`;
}

export type Logger = {
  debug: (message: string, data?: Record<string, unknown>) => void;
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
};

export function createLogger(scope: string): Logger {
  const prefix = `[trippy-tropa:${scope}]`;

  const write = (level: LogLevel, message: string, data?: Record<string, unknown>) => {
    if (!shouldLog(level)) return;
    const line = `${prefix} ${message}${serialize(data)}`;
    switch (level) {
      case "debug":
        console.debug(line);
        break;
      case "info":
        console.info(line);
        break;
      case "warn":
        console.warn(line);
        break;
      case "error":
        console.error(line);
        break;
    }
  };

  return {
    debug: (message, data) => write("debug", message, data),
    info: (message, data) => write("info", message, data),
    warn: (message, data) => write("warn", message, data),
    error: (message, data) => write("error", message, data),
  };
}
