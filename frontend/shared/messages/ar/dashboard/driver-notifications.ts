import type { DriverNotificationsLabels } from "../../types/dashboard/driver-notifications";

export const driverNotifications: DriverNotificationsLabels = {
  title: "إشعارات السائق",
  description:
    "طلبات الرحلات الجديدة، التعيينات، الموافقات، الرفضات، الأرباح والمدفوعات — جميع تنبيهات السائق في مكان واحد.",
  fetchError: "فشل تحميل الإشعارات.",
  markAllError: "فشل وضع جميع الإشعارات كمقروءة.",
  deleteSuccess: "تم حذف الإشعار بنجاح.",
  deleteError: "فشل حذف الإشعار.",
  signInRequired: "يرجى تسجيل الدخول لعرض إشعاراتك.",
  unreadCount: "{count} غير مقروءة",
  markAsReadTooltip: "وضع كمقروءة",
  read: "مقروءة",
  deleteTooltip: "حذف",
  loading: "جاري تحميل الإشعارات...",
  empty: "ليس لديك أي إشعارات بعد.",
  markAllAsReadTooltip: "وضع الكل كمقروءة",
  types: {
    earningReceivedTitle: "تم استلام الأرباح",
    earningReceivedMessage: "تم إضافة أرباح جديدة إلى حسابك.",
    payoutCompletedTitle: "تمت عملية الدفع",
    payoutCompletedMessage: "تم معالجة الدفع بنجاح.",
    payoutRejectedTitle: "تم رفض الدفع",
    payoutRejectedMessage: "تم رفض طلب الدفع الخاص بك. يرجى مراجعة التفاصيل.",
  },
};
