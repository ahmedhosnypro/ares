import type { SupplierEarningsLabels } from "../../../types/dashboard/supplier/earnings";

export const supplierEarnings: SupplierEarningsLabels = {
  title: "Earnings | ARES Supplier",
  description: "Supplier Earnings dashboard — total earnings, monthly revenue, and top performing vehicles.",
  heading: "Earnings Dashboard",
  subtitle:
    "Track your revenue, monthly trend, and top performing vehicles. Figures are scoped to your account and aggregated from completed bookings only.",
  stats: {
    totalEarnings: "Total Earnings",
    totalEarningsSubtitle: "Lifetime, completed bookings",
    thisMonth: "This Month",
    thisMonthSubtitle: "Revenue this calendar month",
    lastMonth: "Last Month",
    lastMonthSubtitle: "Revenue previous calendar month",
    completedBookings: "Completed Bookings",
    completedBookingsSubtitle: "Lifetime, completed only",
  },
  chart: {
    monthlyRevenue: "Monthly Revenue",
    yearSelectorAriaLabel: "Year selector",
    noRevenueRecorded: "No revenue recorded for {year} yet.",
    completedBookingsWillAppear: "Completed bookings will appear here once your customers return their vehicles.",
    revenue: "Revenue",
    revenueBarName: "Revenue",
  },
  topVehicles: {
    heading: "Top Performing Vehicles",
    top5: "Top 5",
    noCompletedBookings: "No completed bookings yet.",
    topPerformersWillAppear: "Once your vehicles start completing rentals, the top performers will rank here.",
    unnamedVehicle: "Unnamed vehicle",
    booking: "booking",
    bookings: "bookings",
    earnings: "earnings",
  },
  errors: {
    notSignedIn: "You must be signed in to view earnings.",
    loadStatsFailed: "Could not load your earnings stats. Please try again shortly.",
    loadTopVehiclesFailed: "Could not load your top vehicles. Please try again shortly.",
    loadChartFailed: "Could not load the monthly chart. Please try again shortly.",
  },
};
