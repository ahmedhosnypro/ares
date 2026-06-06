// app/admin/hooks/useDashboardData.ts
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { apiFetchJson } from "@/utils/api-client";
import { logger } from "@/utils/logger";

export interface DashboardSummary {
  readonly totalUsers: number;
  readonly totalSuppliers: number;
  readonly totalVehicles: number;
  readonly totalBookings: number;
  readonly pendingBookings: number;
  readonly totalRevenue: number;
}

export interface RecentBooking {
  readonly id: string;
  readonly customer: string;
  readonly car: string;
  readonly date: string;
  readonly status: string;
  readonly amount: number;
}

export interface UpcomingBooking {
  readonly id: string;
  readonly customer: string;
  readonly car: string;
  readonly pickupDate: string;
  readonly returnDate: string;
}

export interface ActivityItem {
  readonly type: string;
  readonly message: string;
  readonly createdAt: string;
  readonly icon: string;
}

export interface RevenueDataPoint {
  readonly date: string;
  readonly revenue: number;
}

export function useDashboardData() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentBookings, setRecentBookings] = useState<readonly RecentBooking[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<readonly UpcomingBooking[]>([]);
  const [activities, setActivities] = useState<readonly ActivityItem[]>([]);
  const [revenueData, setRevenueData] = useState<readonly RevenueDataPoint[]>([]);

  useEffect(() => {
    if (status !== "authenticated" || !session.accessToken) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const summaryData = await apiFetchJson<DashboardSummary>("api/dashboard/summary", {
          accessToken: session.accessToken,
        });
        setSummary(summaryData);

        const recent = await apiFetchJson<RecentBooking[]>("api/dashboard/recent-bookings?limit=5", {
          accessToken: session.accessToken,
        });
        setRecentBookings(recent);

        const upcoming = await apiFetchJson<UpcomingBooking[]>("api/dashboard/upcoming-bookings?days=7", {
          accessToken: session.accessToken,
        });
        setUpcomingBookings(upcoming);

        const activity = await apiFetchJson<ActivityItem[]>("api/dashboard/recent-summary", {
          accessToken: session.accessToken,
        });
        setActivities(activity);

        const revenue = await apiFetchJson<RevenueDataPoint[]>("api/dashboard/revenue-week", {
          accessToken: session.accessToken,
        });
        setRevenueData(revenue);
      } catch (error) {
        logger.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchAll();
  }, [session?.accessToken, status]);

  return { loading, summary, recentBookings, upcomingBookings, activities, revenueData };
}
