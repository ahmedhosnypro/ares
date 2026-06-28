export interface SupplierEarningsLabels {
  title: string;
  description: string;
  heading: string;
  subtitle: string;
  stats: {
    totalEarnings: string;
    totalEarningsSubtitle: string;
    thisMonth: string;
    thisMonthSubtitle: string;
    lastMonth: string;
    lastMonthSubtitle: string;
    completedBookings: string;
    completedBookingsSubtitle: string;
  };
  chart: {
    monthlyRevenue: string;
    yearSelectorAriaLabel: string;
    noRevenueRecorded: string;
    completedBookingsWillAppear: string;
    revenue: string;
    revenueBarName: string;
  };
  topVehicles: {
    heading: string;
    top5: string;
    noCompletedBookings: string;
    topPerformersWillAppear: string;
    unnamedVehicle: string;
    booking: string;
    bookings: string;
    earnings: string;
  };
  errors: {
    notSignedIn: string;
    loadStatsFailed: string;
    loadTopVehiclesFailed: string;
    loadChartFailed: string;
  };
}
