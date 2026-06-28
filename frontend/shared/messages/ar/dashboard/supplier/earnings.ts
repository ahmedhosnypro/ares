import type { SupplierEarningsLabels } from "../../types/dashboard/supplier/earnings";

export const supplierEarnings: SupplierEarningsLabels = {
  title: "الأرباح | ARES المورد",
  description: "لوحة أرباح المورد — إجمالي الأرباح، الإيرادات الشهرية، وأفضل المركبات أداءً.",
  heading: "لوحة الأرباح",
  subtitle:
    "تتبع إيراداتك، الاتجاه الشهري، وأفضل المركبات أداءً. الأرقام مخصصة لحسابك ومجمعة من الحجوزات المكتملة فقط.",
  stats: {
    totalEarnings: "إجمالي الأرباح",
    totalEarningsSubtitle: "مدى الحياة، الحجوزات المكتملة",
    thisMonth: "هذا الشهر",
    thisMonthSubtitle: "الإيرادات هذا الشهر التقويمي",
    lastMonth: "الشهر الماضي",
    lastMonthSubtitle: "الإيرادات الشهر التقويمي الماضي",
    completedBookings: "الحجوزات المكتملة",
    completedBookingsSubtitle: "مدى الحياة، المكتملة فقط",
  },
  chart: {
    monthlyRevenue: "الإيرادات الشهرية",
    yearSelectorAriaLabel: "محدد السنة",
    noRevenueRecorded: "لا توجد إيرادات مسجلة لـ {year} حتى الآن.",
    completedBookingsWillAppear: "ستظهر الحجوزات المكتملة هنا بمجرد أن يعيد عملاءك مركباتهم.",
    revenue: "الإيرادات",
    revenueBarName: "الإيرادات",
  },
  topVehicles: {
    heading: "أفضل المركبات أداءً",
    top5: "أفضل 5",
    noCompletedBookings: "لا توجد حجوزات مكتملة بعد.",
    topPerformersWillAppear: "بمجرد أن تبدأ مركباتك في إكمال الإيجارات، ستظهر أفضلها أداءً هنا.",
    unnamedVehicle: "مركبة بدون اسم",
    booking: "حجز",
    bookings: "حجوزات",
    earnings: "الأرباح",
  },
  errors: {
    notSignedIn: "يجب تسجيل الدخول لعرض الأرباح.",
    loadStatsFailed: "تعذر تحميل إحصائيات أرباحك. يرجى المحاولة مرة أخرى قريبًا.",
    loadTopVehiclesFailed: "تعذر تحميل أفضل مركباتك. يرجى المحاولة مرة أخرى قريبًا.",
    loadChartFailed: "تعذر تحميل الرسم البياني الشهري. يرجى المحاولة مرة أخرى قريبًا.",
  },
};
