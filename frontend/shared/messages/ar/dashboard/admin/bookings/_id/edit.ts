import type { EditBookingLabels } from "../../../../../types/dashboard/admin/bookings/_id/edit";

const edit: EditBookingLabels = {
  pageTitle: "تعديل الحجز",
  errors: {
    loadFailed: "فشل في تحميل تفاصيل الحجز.",
    notFound: "الحجز غير موجود.",
    dateError: "يجب أن يكون تاريخ الاستلام قبل تاريخ التسليم.",
    returnDateError: "يجب أن يكون تاريخ التسليم بعد تاريخ الاستلام",
    saveFailed: "فشل في حفظ التغييرات.",
  },
  buttons: {
    cancel: "إلغاء",
    saveChanges: "حفظ التغييرات",
    backToBookings: "العودة إلى الحجوزات",
  },
  notices: {
    terminal: "هذا الحجز في حالة {status} ولا يمكن تعديل تفاصيله بعد الآن.",
    priceCalculation: "يتم إعادة احتساب السعر الإجمالي تلقائياً عند تغيير التواريخ ويتم تأكيده من السيرفر عند الحفظ.",
  },
  bookingSummary: {
    title: "ملخص الحجز",
    plate: "رقم اللوحة: {plate}",
    supplier: "المورد: {name}",
    customer: "العميل",
    paymentStatus: "حالة الدفع",
    unpaid: "غير مدفوع",
    dailyRate: "السعر اليومي",
  },
  editableInfo: {
    title: "معلومات الحجز القابلة للتعديل",
    pickupDate: "تاريخ الاستلام",
    returnDate: "تاريخ التسليم",
    pickupLocation: "موقع الاستلام",
    dropoffLocation: "موقع التسليم",
    bookingStatus: "حالة الحجز",
  },
  pricingSummary: {
    title: "ملخص التسعير",
    dailyRate: "السعر اليومي",
    totalDays: "إجمالي الأيام",
    totalPrice: "السعر الإجمالي",
    daysValue: "{count} {count, plural, zero {يوم} one {يوم} two {يومين} few {أيام} many {يوماً} other {يوم}}",
  },
};

export default edit;
