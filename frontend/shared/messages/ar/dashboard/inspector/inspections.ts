import type { InspectorInspectionsLabels } from "../../../types/dashboard/inspector/inspections";

const inspections: InspectorInspectionsLabels = {
  title: "لوحة تحكم الفاحص",
  description: "نظرة عامة على مهامك ومقاييس اليوم.",
  checkOuts: "تسليم المركبات",
  checkOutsSubtitle: "التسليمات اليوم",
  checkIns: "استلام المركبات",
  checkInsSubtitle: "المرتجعات اليوم",
  overdue: "المهام المتأخرة",
  overdueSubtitle: "تجاوزت الاستحقاق",
  completedToday: "اكتملت اليوم",
  completedTodaySubtitle: "أنجزت اليوم",
  sectionTitle: "مهام اليوم",
  sectionSubtitle: "اضغط على البطاقة لفتح نموذج الفحص · استخدم أزرار الإجراءات للاتصال أو الانتقال للموقع.",
  filters: {
    all: "الكل",
    checkOuts: "التسليمات 🟢",
    checkIns: "الاستلامات 🔴",
  },
  searchPlaceholder: "البحث برقم اللوحة…",
  searchAriaLabel: "البحث برقم اللوحة",
  emptyState: {
    noMatchingTasks: "لا توجد مهام مطابقة",
    allCaughtUp: "تم إنجاز كل شيء!",
    adjustFilter: "حاول تعديل خيارات التصفية أو مصطلح البحث.",
    noPendingTasks: "ليس لديك أي مهام معلقة اليوم.",
  },
  card: {
    checkOutBadge: "تسليم 🟢",
    checkInBadge: "استلام 🔴",
    callTooltip: "الاتصال بـ {customerName}",
    callAriaLabel: "الاتصال بـ {customerName}",
    mapsTooltip: "الفتح في خرائط Google",
    mapsAriaLabel: "فتح الموقع في خرائط Google",
  },
  status: {
    pending: "معلق",
    approved: "مقبول",
    rejected: "مرفوض",
  },
};

export default inspections;
