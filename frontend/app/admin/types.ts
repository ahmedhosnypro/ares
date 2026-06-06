// app/admin/types.ts
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
  status: "Active" | "Completed" | "Pending" | "Cancelled";
  amount: number;
}

export interface UpcomingBooking {
  id: string;
  customer: string;
  car: string;
  pickupDate: string;
  returnDate: string;
  status: string;
}

export interface ActivityItem {
  type: string;
  message: string;
  createdAt: string;
  icon: string;
}
