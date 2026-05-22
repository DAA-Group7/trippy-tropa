import { AuthCard } from "@/components/auth/auth-card";

export const metadata = { title: "Register" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; redirect?: string }>;
}) {
  const { code, redirect } = await searchParams;

  return <AuthCard mode="register" inviteCode={code} redirect={redirect} />;
}
