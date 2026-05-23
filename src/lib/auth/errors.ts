/** User-facing copy for Supabase Auth errors (rate limits, etc.). */
export function formatAuthErrorMessage(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Email rate limit exceeded. Wait a few minutes before trying again, or turn off “Confirm email” in Supabase Auth settings for local testing.";
  }

  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }

  if (lower.includes("invalid") && lower.includes("email")) {
    return "That email address could not be used. Check for typos and try again.";
  }

  return message;
}

export function isAuthRateLimitError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("rate limit") || lower.includes("too many requests");
}
