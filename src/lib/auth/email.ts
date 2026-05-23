import { z } from "zod";

const emailSchema = z.string().trim().toLowerCase().pipe(z.string().email());

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function parseEmail(
  raw: string
): { ok: true; email: string } | { ok: false; error: string } {
  const result = emailSchema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      error: "Enter a valid email address (e.g. janedoe@gmail.com)",
    };
  }
  return { ok: true, email: result.data };
}
