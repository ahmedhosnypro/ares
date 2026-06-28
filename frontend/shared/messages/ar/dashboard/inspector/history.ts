import type { InspectorHistoryLabels } from "../../../types/dashboard/inspector/history";

export const inspectorHistory: InspectorHistoryLabels = {
  title: "سجل الفحوصات",
  description: "عرض جميع الفحوصات المقدمة.",
  search: {
    placeholder: "ابحث برقم الحجز، المركبة، أو الحالة...",
  },
  filter: {
    statusLabel: "الحالة",
    allStatuses: "جميع الحالات",
    approved: "مقبول",
    rejected: "مرفوض",
    pending: "قيد الانتظار",
  },
  emptySearch: {
    title: "لم يتم العثور على نتائج",
    description: "حاول تعديل بحثك أو فلتر الحالة.",
  },
  emptyState: {
    title: "لا يوجد سجل بعد",
    description: "ستظهر الفحوصات المقدمة هنا.",
  },
  mobileCard: {
    photos: "الصور: {count}",
    submittedDate: "تم الإرسال: {date}",
    submittedFallback: "—",
    viewReport: "عرض التقرير",
  },
  table: {
    booking: "الحجز",
    vehicle: "المركبة",
    submittedAt: "تاريخ الإرسال",
    photos: "الصور",
    viewDetails: "عرض التفاصيل",
  },
};
