import type { InspectorHistoryLabels } from "../../../types/dashboard/inspector/history";

const history: InspectorHistoryLabels = {
  title: "سجل الفحوصات",
  description: "عرض جميع الفحوصات التي قمت بتقديمها.",
  searchPlaceholder: "البحث برقم الحجز، المركبة، أو الحالة...",
  filterStatusLabel: "الحالة",
  filterAllStatuses: "جميع الحالات",
  noResults: {
    title: "لم يتم العثور على نتائج",
    description: "حاول تعديل مصطلح البحث أو تصفية الحالة.",
  },
  emptyHistory: {
    title: "لا يوجد سجل بعد",
    description: "الفحوصات التي يتم تقديمها ستظهر هنا.",
  },
  mobileCard: {
    photosCount: "الصور: {count}",
    submittedAt: "تاريخ التقديم: {date}",
    submittedFallback: "—",
    viewReport: "عرض التقرير",
  },
  table: {
    booking: "الحجز",
    vehicle: "المركبة",
    submittedAt: "تاريخ التقديم",
    photos: "الصور",
    status: "الحالة",
    action: "الإجراء",
    viewDetails: "عرض التفاصيل",
  },
  status: {
    pending: "معلق",
    approved: "مقبول",
    rejected: "مرفوض",
  },
};

export default history;
