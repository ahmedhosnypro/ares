import { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "@/shared/i18n/routing";
import VehiclesView from "./VehiclesView";

export const metadata: Metadata = {
  title: "Admin Fleet Management | ARES Car Rental",
  description:
    "Monitor operational status, view performance metrics, and perform bulk operations on the vehicle fleet.",
};

export default async function AdminVehiclesPage() {
  const locale = await getLocale();
  const session = await getServerSession(authOptions);

  if (!session || !session.user.roles.includes("Admin") || !session.accessToken) {
    return redirect({ href: "/", locale });
  }

  return <VehiclesView />;
}
