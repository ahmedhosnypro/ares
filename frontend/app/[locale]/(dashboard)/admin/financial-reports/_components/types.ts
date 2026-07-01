export interface BookingSummaryItem {
  status: string;
  bookings: number;
  amount: number;
  percentage: number;
}

export interface MonthlyRevenueItem {
  month: string;
  revenue: number;
}

export interface PaymentMethodItem {
  method: string;
  paidAmount: number;
  percentage: number;
  amount?: number; // Optional fallback mapping
  fill?: string; // Optional style mapping
}

export interface RecentPaymentItem {
  bookingNumber: string;
  customerName: string;
  vehicleName: string;
  amount: number;
  method: string;
  status: string;
  date: string;
}

export interface TopVehicleItem {
  vehicleName: string;
  rank: number;
  completedBookings: number;
  revenue: number;
}

export interface SupplierEarningItem {
  supplierName: string;
  totalVehicles: number;
  completedBookings: number;
  revenue: number;
  commission: number;
  netAmount: number;
}

export interface FinancialReportsData {
  totalRevenue: number;
  totalRevenueChange: number;
  paidAmount: number;
  paidAmountChange: number;
  pendingAmount: number;
  pendingAmountChange: number;
  refundedAmount: number;
  refundedAmountChange: number;
  bookingSummary: BookingSummaryItem[];
  monthlyRevenue: MonthlyRevenueItem[];
  paymentMethods: PaymentMethodItem[];
  recentPayments: RecentPaymentItem[];
  topVehicles: TopVehicleItem[];
  supplierEarnings: SupplierEarningItem[];
}
