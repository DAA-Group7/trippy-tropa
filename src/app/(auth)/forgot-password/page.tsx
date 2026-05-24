import { ForgotPasswordCard } from "@/components/auth/forgot-password-card";

export const metadata = { title: "Reset password" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; redirect?: string }>;
}) {
  const { code, redirect } = await searchParams;

  return <ForgotPasswordCard inviteCode={code} redirect={redirect} />;
}
