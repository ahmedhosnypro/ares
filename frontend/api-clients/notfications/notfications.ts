import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationEnvelope {
  notifications: NotificationItem[];
}

export type NotificationsResponse = NotificationItem[] | NotificationEnvelope;

export interface MarkNotificationReadResponse {
  success: boolean;
}

export interface NotificationCountResponse {
  count?: number;
  unreadCount?: number;
}

export interface SeedNotificationsResponse {
  success?: boolean;
  message?: string;
}

/**
 * جلب جميع التنبيهات للمستخدم المصادق عليه
 */
export const getNotifications = async (token: string): Promise<NotificationsResponse> => {
  const res = await fetch(toApiUrl("/api/notifications"), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json", // يفضل استخدام json بدل text/plain إذا كان السيرفر يدعم ذلك
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    logger.error("Fetch Notifications Error", errorText);
    throw new Error(`Failed to fetch: ${String(res.status)}`);
  }

  return (await res.json()) as NotificationsResponse;
};

/**
 * تحديث حالة التنبيه إلى "مقروء"
 */
export const markNotificationAsRead = async (id: string, token: string): Promise<MarkNotificationReadResponse> => {
  const res = await fetch(toApiUrl(`/api/notifications/${id}/read`), {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    // بعض السيرفرات تتطلب إرسال body فارغ في طلبات PUT
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const errorText = await res.text();
    logger.error("Mark As Read Error", errorText);
    throw new Error(`Failed to mark as read: ${String(res.status)}`);
  }

  // ملاحظة: إذا كان السيرفر يعيد استجابة فارغة (204 No Content)،
  // فإن res.json() قد تسبب خطأ. يفضل التأكد من حالة الاستجابة:
  if (res.status === 204) {
    return { success: true };
  }

  return (await res.json()) as MarkNotificationReadResponse;
};

/**
 * جلب عداد التنبيهات غير المقروءة (موجود في الصورة الثالثة)
 */
export const getNotificationCount = async (userId: string, token: string): Promise<NotificationCountResponse> => {
  const res = await fetch(toApiUrl(`/api/notification-counter/${userId}`), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) throw new Error("Failed to get notification count");
  return (await res.json()) as NotificationCountResponse;
};

/**
 * إنشاء تنبيهات تجريبية للمستخدم (للاختبار)
 */
export const seedNotifications = async (token: string): Promise<SeedNotificationsResponse> => {
  const res = await fetch(toApiUrl("/api/notifications/seed"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to seed notifications: ${String(res.status)}`);
  }

  return (await res.json()) as SeedNotificationsResponse;
};
