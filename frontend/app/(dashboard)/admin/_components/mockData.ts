export interface RevenueDataPoint {
  date: string;
  revenue: number;
  bookings: number;
  refunds: number;
}

export interface VehicleStatusData {
  name: string;
  value: number;
  color: string;
}

export interface QuickAction {
  label: string;
  icon: string;
  path: string;
  color: "primary" | "secondary" | "success" | "warning" | "error" | "info";
}

export interface TopVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  bookingsCount: number;
  revenue: number;
  imageUrl: string;
}

export interface AlertActivity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "info" | "warning" | "error" | "success";
}

export const mockRevenueData: RevenueDataPoint[] = [
  { date: "May 1", revenue: 45000, bookings: 58000, refunds: 5000 },
  { date: "May 6", revenue: 52000, bookings: 72000, refunds: 8000 },
  { date: "May 11", revenue: 48000, bookings: 65000, refunds: 6000 },
  { date: "May 16", revenue: 68000, bookings: 86000, refunds: 4000 },
  { date: "May 21", revenue: 75000, bookings: 94000, refunds: 9000 },
  { date: "May 25", revenue: 69000, bookings: 88000, refunds: 5000 },
];

export const mockVehicleStatusData: VehicleStatusData[] = [
  { name: "Available", value: 145, color: "status.active.main" },
  { name: "Booked", value: 120, color: "status.confirmed.main" },
  { name: "Maintenance", value: 15, color: "status.pending.main" },
  { name: "Out of Service", value: 5, color: "status.blocked.main" },
];

export const mockCityVehicleData: Record<string, VehicleStatusData[]> = {
  "All Cities": mockVehicleStatusData,
  "Cairo": [
    { name: "Available", value: 65, color: "status.active.main" },
    { name: "Booked", value: 80, color: "status.confirmed.main" },
    { name: "Maintenance", value: 10, color: "status.pending.main" },
    { name: "Out of Service", value: 2, color: "status.blocked.main" },
  ],
  "Alexandria": [
    { name: "Available", value: 40, color: "status.active.main" },
    { name: "Booked", value: 25, color: "status.confirmed.main" },
    { name: "Maintenance", value: 3, color: "status.pending.main" },
    { name: "Out of Service", value: 1, color: "status.blocked.main" },
  ],
  "Giza": [
    { name: "Available", value: 40, color: "status.active.main" },
    { name: "Booked", value: 15, color: "status.confirmed.main" },
    { name: "Maintenance", value: 2, color: "status.pending.main" },
    { name: "Out of Service", value: 2, color: "status.blocked.main" },
  ]
};

export const mockQuickActions: QuickAction[] = [
  { label: "Assign Inspector", icon: "AssignmentInd", path: "/admin/bookings", color: "primary" },
  { label: "Review Verifications", icon: "Shield", path: "/admin/verifications", color: "warning" },
  { label: "Review Inspections", icon: "FactCheck", path: "/admin/inspections", color: "info" },
  { label: "Add Vehicle", icon: "Car", path: "/admin/vehicles/create", color: "success" },
];

export const mockTopVehicles: TopVehicle[] = [
  {
    id: "1",
    make: "Mercedes-Benz",
    model: "S-Class",
    year: 2023,
    bookingsCount: 120,
    revenue: 12500,
    imageUrl: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=200&h=200",
    trendPercentage: 12,
  },
  {
    id: "2",
    make: "BMW",
    model: "X7",
    year: 2024,
    bookingsCount: 95,
    revenue: 9800,
    imageUrl: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=200&h=200",
    trendPercentage: 8,
  },
  {
    id: "3",
    make: "Toyota",
    model: "Land Cruiser",
    year: 2023,
    bookingsCount: 84,
    revenue: 8400,
    imageUrl: "https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=format&fit=crop&q=80&w=200&h=200",
    trendPercentage: -3,
  },
];

export interface DashboardAlert {
  id: string;
  message: string;
  timestamp: string;
  type: "error" | "warning" | "info" | "success";
}

export interface DashboardActivity {
  id: string;
  description: string;
  timeAgo: string;
  type: "booking" | "registration" | "inspection" | "refund";
}

export const mockAlerts: DashboardAlert[] = [
  {
    id: "al1",
    message: "3 driver licenses will expire in 7 days",
    timestamp: "May 25, 2024 • 10:30 AM",
    type: "warning",
  },
  {
    id: "al2",
    message: "Database backup completed successfully",
    timestamp: "May 24, 2024 • 03:00 AM",
    type: "success",
  },
  {
    id: "al3",
    message: "Payment gateway timeout for booking #BK-8A2F",
    timestamp: "May 24, 2024 • 02:15 PM",
    type: "error",
  },
  {
    id: "al4",
    message: "New policy update pending approval",
    timestamp: "May 23, 2024 • 09:00 AM",
    type: "info",
  },
];

export const mockActivities: DashboardActivity[] = [
  {
    id: "ac1",
    description: "Ahmed Farag booked BMW X5",
    timeAgo: "2 min ago",
    type: "booking",
  },
  {
    id: "ac2",
    description: "Sarah Smith registered as Supplier",
    timeAgo: "15 min ago",
    type: "registration",
  },
  {
    id: "ac3",
    description: "Toyota Land Cruiser passed inspection",
    timeAgo: "1 hour ago",
    type: "inspection",
  },
  {
    id: "ac4",
    description: "Refund of $150 processed for John Doe",
    timeAgo: "3 hours ago",
    type: "refund",
  },
];
