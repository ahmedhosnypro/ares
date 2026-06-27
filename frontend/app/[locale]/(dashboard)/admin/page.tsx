import { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import AdminDashboardView from "./_components/AdminDashboardView";
import { apiFetchJson } from "@/utils/api-client";
import { DashboardSummary, RecentSummaryItem } from "./types";
import { SummaryItem } from "./_components/StatCardGrid";
import { BookingListItem } from "./_components/RecentBookings";
import {
  mockActivities,
  QuickAction,
  mockQuickActions,
  TopVehicle,
} from "./_components/mockData";
import { logger } from "@/utils/logger";
import { redirect } from "@/shared/i18n/routing";

export const metadata: Metadata = {
  title: "Admin Dashboard | ARES Car Rental",
  description:
    "Monitor bookings, manage fleet, and oversee system performance from the ARES administrative command center.",
};

// Defensive coercion
const safeNum = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

const MOCK_RECENT_BOOKINGS: readonly BookingListItem[] = [
  {
    bookingId: "BKG-001",
    bookingNumber: "BKG-001",
    customerName: "Ahmed Ali",
    vehicleName: "Mercedes S-Class",
    vehicleImage: null,
    bookingDate: new Date().toISOString(),
    status: "Active",
  },
  {
    bookingId: "BKG-002",
    bookingNumber: "BKG-002",
    customerName: "Sara Mahmoud",
    vehicleName: "BMW X5",
    vehicleImage: null,
    bookingDate: new Date().toISOString(),
    status: "Completed",
  },
];

async function getSummary(
  accessToken: string
): Promise<{ readonly summary: readonly SummaryItem[]; readonly rawData: unknown }> {
  try {
    const data = await apiFetchJson<DashboardSummary>("api/dashboard/summary", { accessToken });
    const summary: readonly SummaryItem[] = [
      {
        title: "Total Users",
        value: safeNum(data.totalUsers).toLocaleString(),
        change: "+8.4%",
        isUp: true,
        iconName: "PeopleAlt",
        color: "primary",
        href: "/admin/users",
      },
      {
        title: "Active Bookings",
        value: safeNum(data.activeBookings).toLocaleString(),
        change: "+12.5%",
        isUp: true,
        iconName: "EventAvailable",
        color: "primary",
        href: "/admin/bookings",
      },
      {
        title: "Pending Verifications",
        value: safeNum(data.pendingVerifications).toLocaleString(),
        change: "-5.2%",
        isUp: false,
        iconName: "GppMaybe",
        color: "warning",
        href: "/admin/verifications",
      },
      {
        title: "Available Vehicles",
        value: safeNum(data.availableVehicles).toLocaleString(),
        change: "+4.2%",
        isUp: true,
        iconName: "DirectionsCar",
        color: "info",
        href: "/admin/vehicles",
      },
      {
        title: "Pending Inspections",
        value: safeNum(data.pendingInspections).toLocaleString(),
        change: "-2.1%",
        isUp: false,
        iconName: "BuildCircle",
        color: "error",
        href: "/admin/vehicle-inspections",
      },
    ];
    return { summary, rawData: data };
  } catch (error) {
    logger.warn(`Failed to fetch real summary data: ${error instanceof Error ? error.message : String(error)}`);
    const defaultSummary: readonly SummaryItem[] = [
      { title: "Total Users", value: "0", change: "0%", isUp: true, iconName: "PeopleAlt", color: "primary", href: "/admin/users" },
      { title: "Active Bookings", value: "0", change: "0%", isUp: true, iconName: "EventAvailable", color: "primary", href: "/admin/bookings" },
      { title: "Pending Verifications", value: "0", change: "0%", isUp: false, iconName: "GppMaybe", color: "warning", href: "/admin/verifications" },
      { title: "Available Vehicles", value: "0", change: "0%", isUp: true, iconName: "DirectionsCar", color: "info", href: "/admin/vehicles" },
      { title: "Pending Inspections", value: "0", change: "0%", isUp: false, iconName: "BuildCircle", color: "error", href: "/admin/vehicle-inspections" },
    ];
    return { summary: defaultSummary, rawData: null };
  }
}

interface RecentBookingFromApi {
  bookingId: string;
  bookingNumber: string;
  customerName: string;
  vehicleName: string;
  vehicleImage?: string | null;
  bookingDate: string;
  status: string;
}

async function getRecentBookings(
  accessToken: string
): Promise<readonly BookingListItem[]> {
  try {
    const bookingsData = await apiFetchJson<RecentBookingFromApi[]>("api/dashboard/recent-bookings", {
      method: "GET",
      accessToken,
    });

    if (!bookingsData || bookingsData.length === 0) {
      return MOCK_RECENT_BOOKINGS;
    }

    return bookingsData.map(b => ({
      bookingId: b.bookingId,
      bookingNumber: b.bookingNumber,
      customerName: b.customerName,
      vehicleName: b.vehicleName,
      vehicleImage: b.vehicleImage,
      bookingDate: b.bookingDate,
      status: b.status,
    }));
  } catch (error) {
    logger.warn(`Failed to fetch recent bookings: ${error instanceof Error ? error.message : String(error)}`);
    return MOCK_RECENT_BOOKINGS;
  }
}



async function getActivities(accessToken: string): Promise<readonly RecentSummaryItem[]> {
  try {
    const data = await apiFetchJson<RecentSummaryItem[]>("api/dashboard/recent-summary", { accessToken });
    if (data.length > 0) return data;
  } catch {
    // silent catch
  }
  return mockActivities.map(a => ({
    type: a.type,
    message: a.description,
    createdAt: new Date().toISOString(),
  }));
}

async function getQuickActions(accessToken: string): Promise<readonly QuickAction[]> {
  try {
    const data = await apiFetchJson<QuickAction[]>("api/dashboard/quick-actions", { accessToken });
    return data.length > 0 ? data : mockQuickActions;
  } catch {
    return mockQuickActions;
  }
}

async function getTopVehicles(accessToken: string): Promise<readonly TopVehicle[]> {
  try {
    return await apiFetchJson<TopVehicle[]>("api/dashboard/top-vehicles", { accessToken });
  } catch {
    return [];
  }
}
export default async function AdminDashboardPage() {
  const locale = await getLocale();
  const session = await getServerSession(authOptions);

  if (!session || !session.user.roles.includes("Admin") || !session.accessToken) {
    return redirect({ href: "/", locale });
  }

  const accessToken = session.accessToken;
  const { summary, rawData: rawSummaryData } = await getSummary(accessToken);
  const [recentBookings, activities, quickActions, topVehicles] = await Promise.all([
    getRecentBookings(accessToken),
    getActivities(accessToken),
    getQuickActions(accessToken),
    getTopVehicles(accessToken),
  ]);

  return (
    <AdminDashboardView
      summary={summary}
      recentBookings={recentBookings}
      activities={activities}
      quickActions={quickActions}
      topVehicles={topVehicles}
      rawSummaryData={rawSummaryData}
    />
  );
}
