import type { SupplierBookingsLabels } from "../../../types/dashboard/supplier/bookings";

export const supplierBookings: SupplierBookingsLabels = {
  metaTitle: "الحجوزات | موردي ARES",
  metaDescription: "قائمة حجوزات المورد.",
  title: "الحجوزات",
  subtitle: "مراقبة وإدارة جميع حجوزات مركباتك",
  search: {
    placeholder: "البحث بالرقم أو العميل أو المركبة…",
  },
  filters: {
    bookingStatus: "حالة الحجز",
    paymentStatus: "حالة الدفع",
    allStatuses: "جميع الحالات",
    bookingStatusOptions: {
      draft: "مسودة",
      paymentPending: "في انتظار الدفع",
      confirmed: "مؤكد",
      active: "نشط",
      completed: "مكتمل",
      cancelled: "ملغى",
    },
    paymentStatusOptions: {
      pending: "قيد الانتظار",
      authorized: "مصرح به",
      captured: "مقبوض",
      failed: "فاشل",
      refunded: "مسترد",
    },
  },
  statusLabels: {
    completed: "مكتمل",
    cancelled: "ملغى",
    draft: "مسودة",
    paymentPending: "في انتظار الدفع",
  },
  table: {
    customer: "العميل",
    vehicle: "المركبة",
    period: "الفترة",
    payment: "الدفع",
    total: "الإجمالي",
    created: "تاريخ الإنشاء",
  },
  empty: {
    title: "لم يتم العثور على حجوزات",
    description: "جرّب تعديل الفلاتر.",
  },
  customerDefault: "عميل غير معروف",
  paymentDefault: "قيد الانتظار",
  footer: {
    showingPage: "عرض الصفحة {page} من {totalPages} ({totalCount} إجمالي)",
  },
  actions: {
    viewDetails: "عرض التفاصيل",
  },
};
