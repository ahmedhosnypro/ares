// app/admin/hooks/useDashboardData.ts
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { apiFetchJson } from "@/utils/api-client";

export interface DashboardSummary {
  totalUsers: number;
  totalSuppliers: number;
  totalVehicles: number;
  totalBookings: number;
  pendingBookings: number;
  totalRevenue: number;
}

export interface RecentBooking {
  id: string;
  customer: string;
  car: string;
  date: string;
  status: string;
  amount: number;
}

export interface UpcomingBooking {
  id: string;
  customer: string;
  car: string;
  pickupDate: string;
  returnDate: string;
}

export interface ActivityItem {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  type: string;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export function useDashboardData() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingBooking[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        // 1. الملخص (موجود ويعمل)
        const summaryData = await apiFetchJson<DashboardSummary>("api/dashboard/summary", {
          accessToken: session.accessToken,
        });
        setSummary(summaryData);

        // 2. الحجوزات الأخيرة (إذا كان الـ endpoint موجودًا، وإلا استخدم mock)
        try {
          const bookingsData = await apiFetchJson<any>("api/admin/bookings/search/1/5", {
            method: "POST",
            accessToken: session.accessToken,
            body: JSON.stringify({
              userId: null,
              suppliers: session.user?.roles?.includes("Supplier") ? [session.user.id] : null,
              statuses: null,
              carId: null,
              filter: {
                from: null,
                to: null,
                keyword: null,
                pickupLocation: null,
                dropOffLocation: null
              },
              page: 1,
              size: 5,
              language: "en"
            })
          });
          
          const bookingsList = bookingsData?.resultData || bookingsData?.data || bookingsData?.items;
          if (bookingsList) {
            const mappedBookings = bookingsList.map((b: any) => ({
              id: (b.id || b._id || "").toString().substring(0, 8).toUpperCase(),
              customer: b.driver?.fullName || "Guest",
              car: b.car?.name || "Vehicle",
              date: b.from ? new Date(b.from).toLocaleDateString() : "",
              status: b.status || "Pending",
              amount: b.price || 0
            }));
            setRecentBookings(mappedBookings);
          } else {
            setRecentBookings([]);
          }
        } catch (err) {
          console.error("Failed to fetch recent bookings:", err);
          setRecentBookings([]);
        }

        // 3. الحجوزات القادمة
        try {
          const upcoming = await apiFetchJson<UpcomingBooking[]>("api/bookings/upcoming?days=7", {
            accessToken: session.accessToken,
          });
          setUpcomingBookings(upcoming);
        } catch {
          setUpcomingBookings([
            { id: "BKG-010", customer: "Layla Hassan", car: "Tesla Model S", pickupDate: "Oct 28", returnDate: "Oct 30" },
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
            { id: "act1", action: "New booking created", user: "John Doe", timestamp: new Date().toISOString(), type: "booking" },
            { id: "act2", action: "Vehicle added: BMW X7", user: "Admin", timestamp: new Date().toISOString(), type: "vehicle" },
            { id: "act3", action: "Payment received $450", user: "Ahmed Ali", timestamp: new Date().toISOString(), type: "payment" },
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
        console.error("Failed to fetch summary:", error);
        // ملخص وهمي حتى لا تتعطل الصفحة
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

    fetchAll();
  }, [session, status]);

  return { loading, summary, recentBookings, upcomingBookings, activities, revenueData };
}