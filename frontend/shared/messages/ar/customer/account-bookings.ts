import type { AccountBookingsLabels } from "../../types/customer/account-bookings";

const accountBookings: AccountBookingsLabels = {
  title: "سجل الحجز",
  description: "تتبع وإدارة ومراجعة جميع حجوزات تأجير السيارات الخاصة بك في مكان واحد.",
  loading: "جارٍ تحميل الحجوزات...",
  error: {
    title: "غير قادر على تحميل الحجوزات",
    message: "يرجى المحاولة مرة أخرى في لحظة.",
  },
  empty: {
    title: "لا توجد حجوزات بعد",
    message: "سيظهر سجل حجزك هنا بمجرد إجراء حجز.",
  },
  filters: {
    title: "الفلاتر",
    status: "الحالة",
    dateRange: "نطاق التاريخ",
    startDate: "تاريخ البدء",
    endDate: "تاريخ الانتهاء",
    supplier: "المورد",
    search: "بحث",
    apply: "تطبيق الفلاتر",
    clear: "مسح الفلاتر",
  },
  activeTrip: {
    title: "الرحلة النشطة",
    viewDetails: "عرض تفاصيل الرحلة",
    extendTrip: "تمديد الرحلة",
    vehicleControls: "عناصر التحكم في المركبة",
  },
  export: {
    title: "تصدير السجلات",
    format: "التنسيق",
    csv: "CSV",
    pdf: "PDF",
    excel: "Excel",
    exportButton: "تصدير الحجوزات",
  },
};

export default accountBookings;
