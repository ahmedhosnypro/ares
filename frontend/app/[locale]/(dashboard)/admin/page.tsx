import { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import AdminDashboardView from "./_components/AdminDashboardView";
import { apiFetchJson } from "@/utils/api-client";
import { DashboardSummary, RecentSummaryItem } from "./types";
import { SummaryItem } from "./_components/StatCardGrid";
import { BookingListItem } from "./_components/RecentBookingsTable";
import {
  DashboardAlert,
  mockAlerts,
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
    id: "BK-8A2F",
    customer: "John Doe",
    customerAvatar: "https://ui-avatars.com/api/?name=John+Doe&background=random",
    car: "BMW X7",
    date: new Date().toLocaleDateString(),
    status: "Completed",
    amount: "$350",
  },
  {
    id: "BK-9B3C",
    customer: "Sarah Smith",
    customerAvatar: "https://ui-avatars.com/api/?name=Sarah+Smith&background=random",
    car: "Mercedes S-Class",
    date: new Date().toLocaleDateString(),
    status: "Active",
    amount: "$420",
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
      },
      {
        title: "Active Bookings",
        value: safeNum(data.activeBookings).toLocaleString(),
        change: "+12.5%",
        isUp: true,
        iconName: "EventAvailable",
        color: "primary",
      },
      {
        title: "Pending Verifications",
        value: safeNum(data.pendingVerifications).toLocaleString(),
        change: "-5.2%",
        isUp: false,
        iconName: "GppMaybe",
        color: "warning",
      },
      {
        title: "Available Vehicles",
        value: safeNum(data.availableVehicles).toLocaleString(),
        change: "+4.2%",
        isUp: true,
        iconName: "DirectionsCar",
        color: "info",
      },
      {
        title: "Pending Inspections",
        value: safeNum(data.pendingInspections).toLocaleString(),
        change: "-2.1%",
        isUp: false,
        iconName: "BuildCircle",
        color: "error",
      },
      {
        title: "Total Categories",
        value: safeNum(data.totalCategories).toLocaleString(),
        change: "",
        isUp: true,
        iconName: "Category",
        color: "secondary",
      },
      {
        title: "Active Promotions",
        value: safeNum(data.activePromotions).toLocaleString(),
        change: "",
        isUp: true,
        iconName: "LocalOffer",
        color: "success",
      },
    ];
    return { summary, rawData: data };
  } catch (error) {
    logger.warn(`Failed to fetch real summary data: ${error instanceof Error ? error.message : String(error)}`);
    const defaultSummary: readonly SummaryItem[] = [
      { title: "Total Users", value: "0", change: "0%", isUp: true, iconName: "PeopleAlt", color: "primary" },
      { title: "Active Bookings", value: "0", change: "0%", isUp: true, iconName: "EventAvailable", color: "primary" },
      { title: "Pending Verifications", value: "0", change: "0%", isUp: false, iconName: "GppMaybe", color: "warning" },
      { title: "Available Vehicles", value: "0", change: "0%", isUp: true, iconName: "DirectionsCar", color: "info" },
      { title: "Pending Inspections", value: "0", change: "0%", isUp: false, iconName: "BuildCircle", color: "error" },
      { title: "Total Categories", value: "0", change: "", isUp: true, iconName: "Category", color: "secondary" },
      { title: "Active Promotions", value: "0", change: "", isUp: true, iconName: "LocalOffer", color: "success" },
    ];
    return { summary: defaultSummary, rawData: null };
  }
}

interface BookingFromApi {
  id?: string | number;
  _id?: string | number;
  driver?: { fullName?: string };
  car?: { name?: string };
  from?: string;
  status?: string;
  price?: number;
}

interface BookingApiResponse {
  resultData?: BookingFromApi[];
  data?: BookingFromApi[];
  items?: BookingFromApi[];
}

async function getRecentBookings(
  accessToken: string,
  userId: string,
  roles: readonly string[]
): Promise<readonly BookingListItem[]> {
  try {
    const bookingsData = await apiFetchJson<BookingApiResponse>("api/admin/bookings/search/1/5", {
      method: "POST",
      accessToken,
      body: JSON.stringify({
        userId: null,
        suppliers: roles.includes("Supplier") ? [userId] : null,
        statuses: null,
        carId: null,
        filter: { from: null, to: null, keyword: null, pickupLocation: null, dropOffLocation: null },
        page: 1,
        size: 5,
        language: "en",
      }),
    });

    const bookingsList = bookingsData.resultData ?? bookingsData.data ?? bookingsData.items;
    if (!bookingsList || bookingsList.length === 0) {
      return MOCK_RECENT_BOOKINGS;
    }

    return bookingsList.map(b => ({
      id: String(b.id ?? b._id ?? ""),
      customer: b.driver?.fullName ?? "Guest",
      customerAvatar: undefined, // Let client-side Avatar handle themed fallback
      car: b.car?.name ?? "Vehicle",
      date: b.from ? new Date(b.from).toLocaleDateString() : "",
      status: b.status ?? "Pending",
      amount: `$${String(b.price ?? 0)}`,
    }));
  } catch (error) {
    logger.warn(`Failed to fetch recent bookings: ${error instanceof Error ? error.message : String(error)}`);
    return MOCK_RECENT_BOOKINGS;
  }
}

async function getAlerts(accessToken: string): Promise<readonly DashboardAlert[]> {
  try {
    const data = await apiFetchJson<DashboardAlert[]>("api/dashboard/alerts", { accessToken });
    return data.length > 0 ? data : mockAlerts;
  } catch {
    return mockAlerts;
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
  const [recentBookings, alerts, activities, quickActions, topVehicles] = await Promise.all([
    getRecentBookings(accessToken, session.user.id, session.user.roles),
    getAlerts(accessToken),
    getActivities(accessToken),
    getQuickActions(accessToken),
    getTopVehicles(accessToken),
  ]);

  return (
    <AdminDashboardView
      summary={summary}
      recentBookings={recentBookings}
      alerts={alerts}
      activities={activities}
      quickActions={quickActions}
      topVehicles={topVehicles}
      rawSummaryData={rawSummaryData}
    />
  );
}
