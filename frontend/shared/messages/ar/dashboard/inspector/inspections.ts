import type { InspectorInspectionsLabels } from "../../types/dashboard/inspector/inspections";

export const inspectorInspections: InspectorInspectionsLabels = {
  page: {
    title: "لوحة المفتش",
    subtitle: "نظرة عامة على مهامك ومقاييس اليوم.",
    todayTasksTitle: "مهام اليوم",
    todayTasksSubtitle: "اضغط على البطاقة لفتح نموذج الفحص · استخدم أزرار الإجراء للاتصال أو التنقل.",
  },
  stats: {
    checkOuts: "التسليمات",
    checkOutsSubtitle: "تسليمات اليوم",
    checkIns: "الاستلامات",
    checkInsSubtitle: "استلامات اليوم",
    overdueTasks: "مهام متأخرة",
    overdueTasksSubtitle: "تجاوزت الموعد",
    completedToday: "مكتمل اليوم",
    completedTodaySubtitle: "تم إنجازها اليوم",
  },
  statusBadge: {
    pending: "قيد الانتظار",
    approved: "مقبول",
    rejected: "مرفوض",
  },
  taskCard: {
    checkOut: "تسليم 🟢",
    checkIn: "استلام 🔴",
    callCustomer: "اتصل بـ {customerName}",
    openInMaps: "فتح في خرائط جوجل",
    openInMapsAriaLabel: "فتح الموقع في خرائط جوجل",
  },
  tasksList: {
    filterAll: "الكل",
    filterCheckOuts: "تسليمات 🟢",
    filterCheckIns: "استلامات 🔴",
    searchPlaceholder: "البحث برقم اللوحة…",
    searchAriaLabel: "البحث برقم اللوحة",
  },
  emptyState: {
    noMatchingTasks: "لا توجد مهام مطابقة",
    tryAdjusting: "حاول تعديل الفلتر أو كلمة البحث.",
    allCaughtUp: "أنجزت كل شيء!",
    noPendingTasks: "ليس لديك مهام معلقة لليوم.",
  },
};
