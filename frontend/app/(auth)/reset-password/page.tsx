import ResetPasswordClient from "./ResetPasswordClient";

export default async function ResetPasswordPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ email?: string; token?: string }>;
}>) {
  const resolvedSearchParams = await searchParams;
  const email = resolvedSearchParams.email;
  const token = resolvedSearchParams.token;

  return <ResetPasswordClient email={email} token={token} />;
}
