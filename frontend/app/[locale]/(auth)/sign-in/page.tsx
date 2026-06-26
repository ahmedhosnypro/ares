import { getServerSession } from "next-auth";
import { getLocale } from "next-intl/server";
import { redirect } from "@/shared/i18n/routing";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import SignInForm from "./SignInForm";

export default async function SignInPage() {
  const locale = await getLocale();
  // Check if user is already authenticated
  const session = await getServerSession(authOptions);

  // If authenticated, redirect to profile/dashboard
  if (session) {
    redirect({ href: "/account/profile", locale });
  }

  // If not authenticated, show the sign-in form
  return <SignInForm />;
}
