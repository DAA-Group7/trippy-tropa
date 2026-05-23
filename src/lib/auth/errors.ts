/** User-facing copy for Supabase Auth errors (rate limits, etc.). */
export function formatAuthErrorMessage(
  message: string,
  code?: string | null
): string {
  const lower = message.toLowerCase();
  const normalizedCode = code?.toLowerCase() ?? "";

  if (
    normalizedCode === "over_email_send_rate_limit" ||
    normalizedCode === "over_request_rate_limit" ||
    lower.includes("rate limit") ||
    lower.includes("too many requests")
  ) {
    return "Email rate limit exceeded. Wait about an hour, turn off “Confirm email” in Supabase Auth, or add SUPABASE_SERVICE_ROLE_KEY to .env for local sign-up without confirmation emails.";
  }

  if (
    normalizedCode === "user_already_exists" ||
    lower.includes("already registered") ||
    lower.includes("already been registered")
  ) {
    return "An account with this email already exists. Try signing in instead.";
  }

  if (lower.includes("email not confirmed")) {
    return "Confirm your email first, then sign in. For local dev, disable “Confirm email” in Supabase or add SUPABASE_SERVICE_ROLE_KEY to .env.";
  }

  if (lower.includes("invalid") && lower.includes("email")) {
    return "That email address could not be used. Check for typos and try again.";
  }

  return message;
}

export function isAuthRateLimitError(
  message: string,
  code?: string | null
): boolean {
  const lower = message.toLowerCase();
  const normalizedCode = code?.toLowerCase() ?? "";
  return (
    normalizedCode === "over_email_send_rate_limit" ||
    normalizedCode === "over_request_rate_limit" ||
    lower.includes("rate limit") ||
    lower.includes("too many requests")
  );
}
