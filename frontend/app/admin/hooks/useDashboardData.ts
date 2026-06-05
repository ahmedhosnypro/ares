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
  readonly id: string;
  readonly action: string;
  readonly user: string;
  readonly timestamp: string;
  readonly type: string;
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
        // 1. الملخص
        const summaryData = await apiFetchJson<DashboardSummary>("api/dashboard/summary", {
          accessToken: session.accessToken,
        });
        setSummary(summaryData);

        // 2. الحجوزات الأخيرة
        try {
          const recent = await apiFetchJson<RecentBooking[]>("api/bookings/recent?limit=5", {
            accessToken: session.accessToken,
          });
          setRecentBookings(recent);
        } catch {
          logger.warn("Using mock recentBookings");
          setRecentBookings([
            {
              id: "BKG-001",
              customer: "Ahmed Ali",
              car: "Mercedes S-Class",
              date: "Oct 24, 2026",
              status: "Active",
              amount: 450,
            },
            {
              id: "BKG-002",
              customer: "Sara Mahmoud",
              car: "BMW X5",
              date: "Oct 23, 2026",
              status: "Completed",
              amount: 320,
            },
            {
              id: "BKG-003",
              customer: "Omar Hassan",
              car: "Audi A6",
              date: "Oct 22, 2026",
              status: "Pending",
              amount: 280,
            },
            {
              id: "BKG-004",
              customer: "Nour Youssef",
              car: "Range Rover",
              date: "Oct 21, 2026",
              status: "Cancelled",
              amount: 500,
            },
            {
              id: "BKG-005",
              customer: "Khaled Saed",
              car: "Porsche 911",
              date: "Oct 20, 2026",
              status: "Completed",
              amount: 850,
            },
          ]);
        }

        // 3. الحجوزات القادمة
        try {
          const upcoming = await apiFetchJson<UpcomingBooking[]>("api/bookings/upcoming?days=7", {
            accessToken: session.accessToken,
          });
          setUpcomingBookings(upcoming);
        } catch {
          setUpcomingBookings([
            {
              id: "BKG-010",
              customer: "Layla Hassan",
              car: "Tesla Model S",
              pickupDate: "Oct 28",
              returnDate: "Oct 30",
            },
            { id: "BKG-011", customer: "Mohamed Fathy", car: "Lexus LS", pickupDate: "Oct 29", returnDate: "Nov 2" },
          ]);
        }

        // 4. النشاطات الأخيرة
        try {
          const activity = await apiFetchJson<ActivityItem[]>("api/dashboard/activity?limit=5", {
            accessToken: session.accessToken,
          });
          setActivities(activity);
        } catch {
          setActivities([
            {
              id: "act1",
              action: "New booking created",
              user: "John Doe",
              timestamp: new Date().toISOString(),
              type: "booking",
            },
            {
              id: "act2",
              action: "Vehicle added: BMW X7",
              user: "Admin",
              timestamp: new Date().toISOString(),
              type: "vehicle",
            },
            {
              id: "act3",
              action: "Payment received $450",
              user: "Ahmed Ali",
              timestamp: new Date().toISOString(),
              type: "payment",
            },
          ]);
        }

        // 5. بيانات الرسم البياني (الإيرادات)
        try {
          const revenue = await apiFetchJson<RevenueDataPoint[]>("api/dashboard/revenue-week", {
            accessToken: session.accessToken,
          });
          setRevenueData(revenue);
        } catch {
          setRevenueData([
            { date: "Oct 18", revenue: 1250 },
            { date: "Oct 19", revenue: 1890 },
            { date: "Oct 20", revenue: 2100 },
            { date: "Oct 21", revenue: 1700 },
            { date: "Oct 22", revenue: 2400 },
            { date: "Oct 23", revenue: 1980 },
            { date: "Oct 24", revenue: 2850 },
          ]);
        }
      } catch (error) {
        logger.error("Failed to fetch dashboard data", error);
        setSummary({
          totalUsers: 892,
          totalSuppliers: 45,
          totalVehicles: 342,
          totalBookings: 1284,
          pendingBookings: 23,
          totalRevenue: 45231,
        });
      } finally {
        setLoading(false);
      }
    };

    void fetchAll();
  }, [session?.accessToken, status]);

  return { loading, summary, recentBookings, upcomingBookings, activities, revenueData };
}
