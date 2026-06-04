import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import AdminDashboardView from "./_components/AdminDashboardView";
import { apiFetchJson } from "@/utils/api-client";
import { DashboardSummary } from "./types";
import { SummaryItem } from "./_components/StatCardGrid";
import { BookingListItem } from "./_components/RecentBookingsTable";
import { 
  DashboardAlert, 
  DashboardActivity, 
  mockAlerts, 
  mockActivities,
  RevenueDataPoint,
  mockRevenueData,
  VehicleStatusData,
  mockVehicleStatusData,
  QuickAction,
  mockQuickActions,
  TopVehicle,
  mockTopVehicles
} from "./_components/mockData";
import { logger } from "@/utils/logger";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin Dashboard | ARES Car Rental",
  description: "Monitor bookings, manage fleet, and oversee system performance from the ARES administrative command center.",
};

// Defensive coercion
const safeNum = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.roles.includes("Admin")) {
    redirect("/");
  }

  let summary: SummaryItem[] = [];
  let recentBookings: BookingListItem[] = [];
  let alerts: DashboardAlert[] = [];
  let activities: DashboardActivity[] = [];
  let revenueData: RevenueDataPoint[] = [];
  let vehicleStatusData: VehicleStatusData[] = [];
  let quickActions: QuickAction[] = [];
  let topVehicles: TopVehicle[] = [];

  try {
    const data = await apiFetchJson<DashboardSummary>("api/dashboard/summary", {
      accessToken: session.accessToken,
    });

    if (!data || Object.keys(data).length === 0) {
      logger.warn("Empty dashboard data returned from API, using mock data fallback");
      summary = [
        { title: "Total Revenue", value: "$45,231", change: "+18.2%", isUp: true, iconName: "AttachMoney", color: "success" },
        { title: "Active Bookings", value: "234", change: "+12.5%", isUp: true, iconName: "EventAvailable", color: "primary" },
        { title: "Pending Verifications", value: "45", change: "-5.2%", isUp: false, iconName: "GppMaybe", color: "warning" },
        { title: "Available Vehicles", value: "342", change: "+4.2%", isUp: true, iconName: "DirectionsCar", color: "info" },
        { title: "Active Drivers", value: "892", change: "+8.4%", isUp: true, iconName: "PersonOutline", color: "primary" },
        { title: "Pending Inspections", value: "12", change: "-2.1%", isUp: false, iconName: "BuildCircle", color: "error" },
      ];
    } else {
      summary = [
        {
          title: "Total Revenue",
          value: `$${safeNum(data.totalRevenue).toLocaleString()}`,
          change: "+18.2%",
          isUp: true,
          iconName: "AttachMoney",
          color: "success",
        },
        {
          title: "Active Bookings",
          value: "234",
          change: "+12.5%",
          isUp: true,
          iconName: "EventAvailable",
          color: "primary",
        },
        {
          title: "Pending Verifications",
          value: "45",
          change: "-5.2%",
          isUp: false,
          iconName: "GppMaybe",
          color: "warning",
        },
        {
          title: "Available Vehicles",
          value: safeNum(data.totalVehicles).toLocaleString(),
          change: "+4.2%",
          isUp: true,
          iconName: "DirectionsCar",
          color: "info",
        },
        {
          title: "Active Drivers",
          value: safeNum(data.totalUsers).toLocaleString(),
          change: "+8.4%",
          isUp: true,
          iconName: "PersonOutline",
          color: "primary",
        },
        {
          title: "Pending Inspections",
          value: "12",
          change: "-2.1%",
          isUp: false,
          iconName: "BuildCircle",
          color: "error",
        },
      ];
    }
  } catch (error) {
    logger.warn(`Failed to fetch real summary data, using mock data fallback. Reason: ${error instanceof Error ? error.message : String(error)}`);
    summary = [
      { title: "Total Revenue", value: "$45,231", change: "+18.2%", isUp: true, iconName: "AttachMoney", color: "success" },
      { title: "Active Bookings", value: "234", change: "+12.5%", isUp: true, iconName: "EventAvailable", color: "primary" },
      { title: "Pending Verifications", value: "45", change: "-5.2%", isUp: false, iconName: "GppMaybe", color: "warning" },
      { title: "Available Vehicles", value: "342", change: "+4.2%", isUp: true, iconName: "DirectionsCar", color: "info" },
      { title: "Active Drivers", value: "892", change: "+8.4%", isUp: true, iconName: "PersonOutline", color: "primary" },
      { title: "Pending Inspections", value: "12", change: "-2.1%", isUp: false, iconName: "BuildCircle", color: "error" },
    ];
  }

  try {
    const bookingsData = await apiFetchJson<{ resultData?: any[]; data?: any[]; items?: any[] }>("api/admin/bookings/search/1/5", {
      method: "POST",
      accessToken: session.accessToken,
      body: JSON.stringify({
        userId: null,
        suppliers: session.user.roles.includes("Supplier") ? [session.user.id] : null,
        statuses: null,
        carId: null,
        filter: { from: null, to: null, keyword: null, pickupLocation: null, dropOffLocation: null },
        page: 1,
        size: 5,
        language: "en",
      }),
    });

    const bookingsList = bookingsData.resultData || bookingsData.data || bookingsData.items;
    if (!bookingsList || bookingsList.length === 0) {
      logger.warn("Empty bookings list returned from API, using mock data fallback");
      recentBookings = [
        { id: "BK-8A2F", customer: "John Doe", customerAvatar: "https://i.pravatar.cc/150?img=11", car: "BMW X7", date: new Date().toLocaleDateString(), status: "Completed", amount: "$350" },
        { id: "BK-9B3C", customer: "Sarah Smith", customerAvatar: "https://i.pravatar.cc/150?img=5", car: "Mercedes S-Class", date: new Date().toLocaleDateString(), status: "Active", amount: "$420" },
        { id: "BK-7C4D", customer: "Mike Johnson", customerAvatar: "https://i.pravatar.cc/150?img=8", car: "Toyota Land Cruiser", date: new Date().toLocaleDateString(), status: "Pending", amount: "$280" },
        { id: "BK-6D5E", customer: "Emily Davis", customerAvatar: "https://i.pravatar.cc/150?img=1", car: "Audi Q8", date: new Date().toLocaleDateString(), status: "Cancelled", amount: "$310" },
      ];
    } else {
      recentBookings = bookingsList.map((b: any) => ({
        id: (b.id || b._id || "").toString(),
        customer: b.driver?.fullName || "Guest",
        customerAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(b.driver?.fullName || "Guest")}&background=random`,
        car: b.car?.name || "Vehicle",
        date: b.from ? new Date(b.from).toLocaleDateString() : "",
        status: b.status || "Pending",
        amount: `$${String(b.price || 0)}`,
      }));
    }
  } catch (bkgErr) {
    logger.warn(`Failed to fetch recent bookings, using mock data fallback. Reason: ${bkgErr instanceof Error ? bkgErr.message : String(bkgErr)}`);
    // Mock recent bookings fallback
    recentBookings = [
      { id: "BK-8A2F", customer: "John Doe", customerAvatar: "https://i.pravatar.cc/150?img=11", car: "BMW X7", date: new Date().toLocaleDateString(), status: "Completed", amount: "$350" },
      { id: "BK-9B3C", customer: "Sarah Smith", customerAvatar: "https://i.pravatar.cc/150?img=5", car: "Mercedes S-Class", date: new Date().toLocaleDateString(), status: "Active", amount: "$420" },
      { id: "BK-7C4D", customer: "Mike Johnson", customerAvatar: "https://i.pravatar.cc/150?img=8", car: "Toyota Land Cruiser", date: new Date().toLocaleDateString(), status: "Pending", amount: "$280" },
      { id: "BK-6D5E", customer: "Emily Davis", customerAvatar: "https://i.pravatar.cc/150?img=1", car: "Audi Q8", date: new Date().toLocaleDateString(), status: "Cancelled", amount: "$310" },
    ];
  }

  try {
    const alertsData = await apiFetchJson<DashboardAlert[]>("api/dashboard/alerts", {
      accessToken: session.accessToken,
    });
    
    if (!alertsData || !Array.isArray(alertsData) || alertsData.length === 0) {
      logger.warn("Empty alerts data returned from API, using mock data fallback");
      alerts = mockAlerts;
    } else {
      alerts = alertsData;
    }
  } catch (error) {
    logger.warn(`Failed to fetch alerts data, using mock data fallback`);
    alerts = mockAlerts;
  }

  try {
    const activitiesData = await apiFetchJson<DashboardActivity[]>("api/dashboard/activities", {
      accessToken: session.accessToken,
    });
    
    if (!activitiesData || !Array.isArray(activitiesData) || activitiesData.length === 0) {
      logger.warn("Empty activities data returned from API, using mock data fallback");
      activities = mockActivities;
    } else {
      activities = activitiesData;
    }
  } catch (error) {
    logger.warn(`Failed to fetch activities data, using mock data fallback`);
    activities = mockActivities;
  }

  try {
    const revenueRes = await apiFetchJson<RevenueDataPoint[]>("api/dashboard/revenue", { accessToken: session.accessToken });
    if (!revenueRes || !Array.isArray(revenueRes) || revenueRes.length === 0) {
      revenueData = mockRevenueData;
    } else {
      revenueData = revenueRes;
    }
  } catch (e) {
    revenueData = mockRevenueData;
  }

  try {
    const vehicleStatusRes = await apiFetchJson<VehicleStatusData[]>("api/dashboard/vehicle-status", { accessToken: session.accessToken });
    if (!vehicleStatusRes || !Array.isArray(vehicleStatusRes) || vehicleStatusRes.length === 0) {
      vehicleStatusData = mockVehicleStatusData;
    } else {
      vehicleStatusData = vehicleStatusRes;
    }
  } catch (e) {
    vehicleStatusData = mockVehicleStatusData;
  }

  try {
    const quickActionsRes = await apiFetchJson<QuickAction[]>("api/dashboard/quick-actions", { accessToken: session.accessToken });
    if (!quickActionsRes || !Array.isArray(quickActionsRes) || quickActionsRes.length === 0) {
      quickActions = mockQuickActions;
    } else {
      quickActions = quickActionsRes;
    }
  } catch (e) {
    quickActions = mockQuickActions;
  }

  try {
    const topVehiclesRes = await apiFetchJson<TopVehicle[]>("api/dashboard/top-vehicles", { accessToken: session.accessToken });
    if (!topVehiclesRes || !Array.isArray(topVehiclesRes) || topVehiclesRes.length === 0) {
      topVehicles = mockTopVehicles;
    } else {
      topVehicles = topVehiclesRes;
    }
  } catch (e) {
    topVehicles = mockTopVehicles;
  }

  return (
    <AdminDashboardView 
      summary={summary} 
      recentBookings={recentBookings} 
      alerts={alerts}
      activities={activities}
      revenueData={revenueData}
      vehicleStatusData={vehicleStatusData}
      quickActions={quickActions}
      topVehicles={topVehicles}
      firstName={session.user.firstName}
    />
  );
}
