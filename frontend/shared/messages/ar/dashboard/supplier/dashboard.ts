import type { SupplierDashboardLabels } from "../../../types/dashboard/supplier/dashboard";

export const supplierDashboard: SupplierDashboardLabels = {
  title: "لوحة تحكم الموردين | ARES لتأجير السيارات",
  description: "أدر أسطولك، وتتبع الحجوزات، وراقب أرباحك من بوابة موردي ARES.",
  greeting: {
    welcomeBack: "مرحبًا بعودتك",
    fleetPerformance: "إليك نظرة سريعة على أداء أسطولك.",
  },
  stats: {
    totalVehicles: "إجمالي المركبات",
    pendingVehicles: "المركبات قيد الانتظار",
    activeBookings: "الحجوزات النشطة",
    totalEarnings: "إجمالي الأرباح",
  },
  charts: {
    earningsOverview: "نظرة عامة على الأرباح",
    bookingsByStatus: "الحجوزات حسب الحالة",
    earnings: "الأرباح",
    bookingStatus: {
      pending: "قيد الانتظار",
      confirmed: "مؤكد",
      active: "نشط",
      completed: "مكتمل",
      cancelled: "ملغي",
    },
  },
  topVehicles: {
    heading: "المركبات الأعلى أداءً",
    noCompletedBookings: "لا توجد حجوزات مكتملة بعد.",
    completedBookings: "حجوزات مكتملة",
  },
  vehicleStatus: {
    heading: "حالة المركبات",
  },
  recentActivity: "النشاط الأخير",
  pendingActions: "الإجراءات المعلقة",
  demoActivity: {
    newBooking: "تم استلام حجز جديد لتويوتا كورولا 2024",
    payoutProcessed: "تم معالجة دفعة بقيمة 1,240$",
    listingApproved: "تمت الموافقة على إدراج هيونداي إلنترا من قبل الإدارة",
    bookingCompleted: "تم وضع علامة مكتمل على الحجز #BK-2031",
    customerReview: "ترك العميل تقييم 5 نجوم على كيا سبورتاج",
  },
  demoActivityTime: {
    minutesAgo: "منذ 12 دقيقة",
    hoursAgo: "منذ ساعتين",
    fiveHoursAgo: "منذ 5 ساعات",
    yesterday: "أمس",
  },
  demoPendingActions: {
    vehiclesAwaitingApproval: {
      title: "مركبتان تنتظران موافقة الإدارة",
      description: "المركبات المُضافة حديثًا قيد المراجعة قبل النشر.",
      actionLabel: "مراجعة",
    },
    bookingNeedsConfirmation: {
      title: "حجز واحد بحاجة لتأكيد",
      description: "يوجد عميل ينتظر تأكيدك لتفاصيل الاستلام.",
      actionLabel: "تأكيد",
    },
    completeProfile: {
      title: "أكمل ملف المورد الخاص بك",
      description: "أضف تفاصيل حسابك البنكي لبدء استلام المدفوعات تلقائيًا.",
      actionLabel: "إكمال",
    },
  },
  errors: {
    notSignedIn: "يجب تسجيل الدخول لعرض إحصائيات لوحة التحكم.",
    loadFailed: "تعذر تحميل إحصائيات لوحة التحكم. يرجى المحاولة مرة أخرى قريبًا.",
  },
};
