import type { AdminBookingsLabels } from "../../../types/dashboard/admin/bookings";

const bookings: AdminBookingsLabels = {
  title: "إدارة الحجوزات",
  subtitle: "مراققة وإدارة جميع حجوزات أريس",
  newBooking: "حجز جديد",
  alerts: {
    createdSuccess: "تم إنشاء الحجز {bookingNumber} وهو قيد انتظار دفع العميل.",
    deleteSuccess: "تم حذف الحجز بنجاح.",
    deleteError: "فشل حذف الحجز.",
    changeStatusSuccess: "تم تغيير حالة الحجز بنجاح.",
    changeStatusError: "فشل تغيير الحالة. يرجى المحاولة مرة أخرى.",
  },
  table: {
    daysCount: "{count} {count, plural, one {يوم} other {أيام}}",
    headers: {
      booking: "الحجز",
      vehicle: "المركبة",
      supplier: "المورد",
      period: "الفترة",
      status: "الحالة",
      paymentMethod: "طريقة الدفع",
      paymentStatus: "حالة الدفع",
      total: "الإجمالي",
    },
    pagination: {
      showingPage: "عرض الصفحة <strong/> من {totalPages} (الإجمالي {totalCount})",
    },
    empty: {
      title: "لم يتم العثور على حجوزات",
      description: "جرّب تعديل عوامل التصفية أو إنشاء حجز جديد.",
    },
  },
  filters: {
    searchPlaceholder: "البحث عن طريق المعرف، العميل، أو المركبة...",
    dateFrom: "من",
    dateTo: "إلى",
    statuses: {
      all: "جميع الحالات",
      draft: "مسودة",
      paymentPending: "في انتظار الدفع",
      confirmed: "مؤكد",
      active: "نشط",
      completed: "مكتمل",
      cancelled: "ملغي",
    },
  },
  paymentStatuses: {
    captured: "مدفوع",
    refunded: "مسترجع",
    failed: "فشل",
    pending: "معلق",
    unpaid: "غير مدفوع",
  },
  deleteDialog: {
    title: "حذف الحجز",
    content: "هل أنت متأكد من رغبتك في حذف هذا الحجز؟",
    subcontent: "لا يمكن التراجع عن هذا الإجراء.",
  },
  menu: {
    viewDetails: "عرض التفاصيل",
    editBooking: "تعديل الحجز",
    changeStatus: "تغيير الحالة",
    deleteBooking: "حذف الحجز",
  },
  changeStatusModal: {
    title: "تغيير حالة الحجز",
    currentLabel: "الحالية:",
    newStatusLabel: "الحالة الجديدة",
    statuses: {
      paymentPending: "في انتظار الدفع",
      confirmed: "مؤكد",
      active: "نشط",
      completed: "مكتمل",
      cancelled: "ملغي",
    },
  },
  analytics: {
    title: "توزيع حالة الحجوزات",
    total: "الإجمالي",
    chartTooltip: "الحجوزات",
    kpis: {
      activeBookings: "الحجوزات النشطة",
      pickupQueue: "طابور الاستلام",
      returnQueue: "طابور الإرجاع",
      upcomingPickups: "الاستلامات القادمة",
    },
    statuses: {
      draft: "مسودة",
      paymentPending: "في انتظار الدفع",
      confirmed: "مؤكد",
      active: "نشط",
      completed: "مكتمل",
      cancelled: "ملغي",
      cancelledByAdmin: "ملغي بواسطة المسؤول",
    },
  },
};

export default bookings;
