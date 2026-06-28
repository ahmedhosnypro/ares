import type { SupplierBookingDetailLabels } from "../../../../../types/dashboard/supplier/bookings/_id";

export const supplierBookingDetail: SupplierBookingDetailLabels = {
  metaTitle: "تفاصيل الحجز | ARES المورد",
  metaDescription: "تفاصيل حجز المورد.",
  header: {
    title: "حجز #{ref}",
    statusDraft: "مسودة",
    created: "أُنشئ {date}",
  },
  errors: {
    notFoundOrDenied: "الحجز غير موجود، أو ليس لديك صلاحية لعرضه.",
    sessionExpired: "انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى.",
    forbidden: "ليس لديك صلاحية لعرض هذا الحجز.",
    loadFailedWithStatus: "فشل تحميل تفاصيل الحجز ({status}).",
    loadFailed: "فشل تحميل تفاصيل الحجز.",
    notFound: "الحجز غير موجود.",
  },
  backToBookings: "العودة إلى الحجوزات",
  backToBookingsTooltip: "العودة إلى الحجوزات",
  customerInfo: {
    title: "معلومات العميل",
    name: "الاسم",
    email: "البريد الإلكتروني",
    phone: "الهاتف",
  },
  vehicleInfo: {
    title: "معلومات المركبة",
    plate: "اللوحة: {plate}",
  },
  bookingInfo: {
    title: "معلومات الحجز",
    pickupDate: "تاريخ الاستلام",
    returnDate: "تاريخ الإرجاع",
    totalDays: "إجمالي الأيام",
    daysUnit: "{count} أيام",
    pickupLocation: "موقع الاستلام",
    dropoffLocation: "موقع الإرجاع",
  },
  paymentInfo: {
    title: "معلومات الدفع",
    totalAmount: "المبلغ الإجمالي",
    status: "الحالة",
    pendingStatus: "قيد الانتظار",
    method: "طريقة الدفع",
    processedAt: "تاريخ المعالجة",
  },
};
