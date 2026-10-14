import LoginForm from "@/app/(auth)/login/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const { callbackUrl } = await searchParams;
  const returnTo = typeof callbackUrl === "string" && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
    ? callbackUrl
    : "/";

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <LoginForm returnTo={returnTo} />
    </main>
  );
}
