import type { CustomerNotificationsLabels } from "../../types/customer/notifications";

const notifications: CustomerNotificationsLabels = {
  metaTitle: "إشعاراتي | آريز لتأجير السيارات",
  metaDescription: "تابع آخر مستجدات حجوزاتك والعروض وتنبيهات النظام في مكان واحد.",
  title: "الإشعارات",
  signInRequired: "يرجى تسجيل الدخول لعرض إشعاراتك.",
  loading: "جارٍ تحميل إشعاراتك...",
  empty: "أنت على اطلاع بكل شيء. لا توجد إشعارات بعد.",
  unreadCount: "{count} غير مقروءة",
  read: "مقروء",
  markAsReadTooltip: "تحديد كمقروء",
  deleteTooltip: "حذف",
  markAllAsReadTooltip: "تحديد الكل كمقروء",
  fetchError: "فشل تحميل الإشعارات. يرجى المحاولة مرة أخرى لاحقًا.",
  markAllError: "فشل تحديد الكل كمقروء.",
  deleteSuccess: "تم حذف الإشعار بنجاح.",
  deleteError: "فشل حذف الإشعار. يرجى المحاولة مرة أخرى.",
};

export default notifications;
