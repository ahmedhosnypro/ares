import type { AdminSchedulerLabels } from "../../../types/dashboard/admin/scheduler";

const scheduler: AdminSchedulerLabels = {
  title: "إدارة الجدولة",
  subtitle: "إدارة وجدولة رحلات التوصيل للحجوزات المعلقة",
  scheduleTripBtn: "جدولة رحلة",
  autoAssignBtn: "تعيين تلقائي للسائقين",
  exportScheduleBtn: "تصدير الجدول",
  table: {
    booking: "الحجز",
    customer: "العميل",
    vehicle: "المركبة",
    tripDate: "تاريخ الرحلة",
    status: "الحالة",
    driver: "السائق",
    actions: "الإجراءات",
    empty: "لا توجد حجوزات معلقة بحاجة لجدولة اليوم.",
    noDriver: "لم يتم تعيين سائق",
  },
  assignModal: {
    title: "تعيين سائق",
    description: "اختر سائقاً محترفاً لهذه الرحلة",
    selectDriverPlaceholder: "اختر سائقاً",
    tripDateLabel: "تاريخ الرحلة (الافتراضي: اليوم)",
    cancel: "إلغاء",
    confirm: "تأكيد الجدولة",
  },
  status: {
    pending: "معلق",
    scheduled: "مجدول",
    inProgress: "قيد التنفيذ",
    completed: "مكتمل",
  },
  alerts: {
    scheduleSuccess: "تم جدولة الرحلة بنجاح",
    scheduleError: "فشل جدولة الرحلة",
    autoAssignStart: "تم بدء التعيين التلقائي",
    autoAssignSuccess: "تم التعيين التلقائي للسائقين بنجاح",
    autoAssignError: "فشل التعيين التلقائي",
  },
};

export default scheduler;
