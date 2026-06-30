import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "@/shared/i18n/routing";
import { getLocale } from "next-intl/server";
import { getPendingAssignments } from "@/api-clients/inspections/inspections";
import { listInspectors } from "@/api-clients/inspectors/inspectors";
import { logger } from "@/utils/logger";
import AssignmentCenterClient from "./_components/AssignmentCenterClient";

export const metadata: Metadata = {
  title: "Inspector Assignment Center | ARES Admin",
  description: "Quickly assign inspectors to bookings",
};

export default async function AssignmentCenterPage() {
  const locale = await getLocale();
  const session = await getServerSession(authOptions);

  if (!session || !session.user.roles.includes("Admin") || !session.accessToken) {
    return redirect({ href: "/", locale });
  }

  let pendingAssignments: import("@/api-clients/inspections/inspections").PendingAssignment[] = [];
  let inspectors: import("@/api-clients/inspectors/inspectors").Inspector[] = [];

  try {
    const [assignmentsRes, inspectorsRes] = await Promise.all([
      getPendingAssignments(session.accessToken),
      listInspectors(true, session.accessToken),
    ]);
    pendingAssignments = assignmentsRes || [];
    inspectors = inspectorsRes || [];
  } catch (error) {
    logger.error("Failed to fetch data for Assignment Center", error);
  }

  return <AssignmentCenterClient initialAssignments={pendingAssignments} inspectors={inspectors} />;
}
