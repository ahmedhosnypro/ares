import { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "@/shared/i18n/routing";
import SecurityView from "./SecurityView";

export const metadata: Metadata = {
  title: "Real-Time Payment Security Monitoring | ARES Car Rental",
  description: "Real-time payment security monitoring, access logs, intrusion detection, and file integrity check.",
};

export default async function AdminSecurityPage() {
  const locale = await getLocale();
  const session = await getServerSession(authOptions);

  if (!session || !session.user.roles.includes("Admin") || !session.accessToken) {
    return redirect({ href: "/", locale });
  }

  return <SecurityView />;
}
