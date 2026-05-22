export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf8ff] p-4 md:p-6">
      {children}
    </div>
  );
}
