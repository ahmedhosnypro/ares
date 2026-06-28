import type { SupplierDashboardLabels } from "../../../types/dashboard/supplier/dashboard";

export const supplierDashboard: SupplierDashboardLabels = {
  title: "Supplier Dashboard | ARES Car Rental",
  description: "Manage your fleet, track bookings, and monitor earnings from the ARES supplier portal.",
  greeting: {
    welcomeBack: "Welcome back",
    fleetPerformance: "Here's a snapshot of your fleet's performance.",
  },
  stats: {
    totalVehicles: "Total Vehicles",
    pendingVehicles: "Pending Vehicles",
    activeBookings: "Active Bookings",
    totalEarnings: "Total Earnings",
  },
  charts: {
    earningsOverview: "Earnings Overview",
    bookingsByStatus: "Bookings by Status",
    earnings: "Earnings",
    bookingStatus: {
      pending: "Pending",
      confirmed: "Confirmed",
      active: "Active",
      completed: "Completed",
      cancelled: "Cancelled",
    },
  },
  recentActivity: "Recent Activity",
  pendingActions: "Pending Actions",
  demoActivity: {
    newBooking: "New booking received for Toyota Corolla 2024",
    payoutProcessed: "Payout of $1,240 has been processed",
    listingApproved: "Hyundai Elantra listing approved by admin",
    bookingCompleted: "Booking #BK-2031 marked as completed",
    customerReview: "Customer left a 5-star review on Kia Sportage",
  },
  demoActivityTime: {
    minutesAgo: "12 min ago",
    hoursAgo: "2 hr ago",
    fiveHoursAgo: "5 hr ago",
    yesterday: "Yesterday",
  },
  demoPendingActions: {
    vehiclesAwaitingApproval: {
      title: "2 vehicles awaiting admin approval",
      description: "Newly added vehicles are pending review before going live.",
      actionLabel: "Review",
    },
    bookingNeedsConfirmation: {
      title: "1 booking needs confirmation",
      description: "A customer is waiting for you to confirm their pickup details.",
      actionLabel: "Confirm",
    },
    completeProfile: {
      title: "Complete your supplier profile",
      description: "Add your bank details to start receiving payouts automatically.",
      actionLabel: "Complete",
    },
  },
  errors: {
    notSignedIn: "You must be signed in to view dashboard stats.",
    loadFailed: "Could not load your dashboard stats. Please try again shortly.",
  },
};
