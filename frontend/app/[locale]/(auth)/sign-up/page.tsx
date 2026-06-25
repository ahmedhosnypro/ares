import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import SignUpForm from "./SignUpForm";

export default async function SignUpPage() {
  // Check if user is already authenticated
  const session = await getServerSession(authOptions);

  // If authenticated, redirect to profile/dashboard
  if (session) {
    redirect("/account/profile");
  }

  // If not authenticated, show the sign-up form
  return <SignUpForm />;
}
