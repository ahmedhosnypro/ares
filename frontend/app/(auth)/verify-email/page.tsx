import React from 'react';
import VerifyEmailClient from './VerifyEmailClient';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string; token?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const userId = resolvedSearchParams.userId;
  const token = resolvedSearchParams.token;

  return <VerifyEmailClient userId={userId} token={token} />;
}
