import { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "@/shared/i18n/routing";
import BankDetailsView from "./BankDetailsView";

export const metadata: Metadata = {
  title: "Admin Bank Account Configuration | ARES Car Rental",
  description: "View and manage the official platform bank account details displayed to customers.",
};

export default async function AdminBankDetailsPage() {
  const locale = await getLocale();
  const session = await getServerSession(authOptions);

  if (!session || !session.user.roles.includes("Admin") || !session.accessToken) {
    return redirect({ href: "/", locale });
  }

  return <BankDetailsView />;
}
