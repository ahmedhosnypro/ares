import type { DriverDashboardLabels } from "../../types/dashboard/driver-dashboard";

export const driverDashboard: DriverDashboardLabels = {
  title: "لوحة تحكم السائق",
  description: "إدارة طلبات القيادة والرحلات والأرباح الخاصة بك.",
  historicalPayoutLogs: "سجلات الدفع التاريخية",
  dashboardHeader: {
    welcomeBack: "مرحبًا بعودتك، {userName}!",
    portalDescription: "بوابة سائق ARES المميزة • الوردية نشطة ومراقبة.",
  },
  kpiMetrics: {
    overviewMetrics: "معدلات النظرة العامة",
    earnings: "الأرباح",
    tripsDone: "الرحلات المكتملة",
    scheduled: "المجدولة",
    rating: "التقييم",
  },
  activeAssignment: {
    activeRentalAssignment: "مهمة الإيجار النشطة",
    inProgress: "قيد التنفيذ",
    assignedClient: "العميل المعين",
    premiumCustomer: "عميل مميز",
    callClient: "الاتصال بالعميل",
    whatsappClient: "الواتساب مع العميل",
    journeyPath: "مسار الرحلة",
    pickupAddress: "عنوان الاستلام",
    dropoffDestination: "وجهة التوصيل",
    assignedFleetVehicle: "مركبة الأسطول المعينة",
    luxurySedanClass: "فئة سيدان فاخر",
    rentalScheduleAndGuidelines: "جدول الإيجار والإرشادات",
    activeDuration: "المدة النشطة",
    guidelines: [
      "تأكد من بقاء مقصورة المركبة نظيفة و stocked بوسائل الراحة الخاصة بالعميل.",
      "تحقق من جدول المسار واضبطه حسب حركة المرور قبل استلام العميل.",
      "أبلغ عن أي تأخير أو مشاكل في القياسات عن بعد فورًا عبر الإرسال.",
    ],
  },
  upcomingSchedule: {
    calendarAndShiftSchedule: "التقويم وجدول الورديات",
  },
  payoutLogs: {
    tripId: "معرف الرحلة",
    dateCompleted: "تاريخ الانتهاء",
    client: "العميل",
    vehicle: "المركبة",
    duration: "المدة",
    earnings: "الأرباح",
    payoutStatus: "حالة الدفع",
  },
};
