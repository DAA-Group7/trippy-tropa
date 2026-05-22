import { AuthCard } from "@/components/auth/auth-card";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; redirect?: string }>;
}) {
  const { code, redirect } = await searchParams;

  return <AuthCard mode="login" inviteCode={code} redirect={redirect} />;
}
