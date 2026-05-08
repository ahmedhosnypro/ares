import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type?: string | null;
}

export interface NotificationEnvelope {
  notifications: NotificationItem[];
}

export type NotificationsResponse = NotificationItem[] | NotificationEnvelope;

export interface MarkNotificationReadResponse {
  success: boolean;
}

export interface MarkAllReadResponse {
  success: boolean;
  updated?: number;
}

export interface NotificationCountResponse {
  count?: number;
  unreadCount?: number;
}

export interface SeedNotificationsResponse {
  success?: boolean;
  message?: string;
}

const jsonHeaders = (token: string): HeadersInit => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
  "Content-Type": "application/json",
});

export const getNotifications = async (token: string): Promise<NotificationsResponse> => {
  const res = await fetch(toApiUrl("/api/notifications"), {
    method: "GET",
    headers: jsonHeaders(token),
  });

  if (!res.ok) {
    const errorText = await res.text();
    logger.error("Fetch Notifications Error", errorText);
    throw new Error(`Failed to fetch: ${String(res.status)}`);
  }

  return (await res.json()) as NotificationsResponse;
};

export const markNotificationAsRead = async (id: string, token: string): Promise<MarkNotificationReadResponse> => {
  const res = await fetch(toApiUrl(`/api/notifications/${id}/read`), {
    method: "PATCH",
    headers: jsonHeaders(token),
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const errorText = await res.text();
    logger.error("Mark As Read Error", errorText);
    throw new Error(`Failed to mark as read: ${String(res.status)}`);
  }

  if (res.status === 204) {
    return { success: true };
  }

  return (await res.json()) as MarkNotificationReadResponse;
};

export const markAllNotificationsAsRead = async (token: string): Promise<MarkAllReadResponse> => {
  const res = await fetch(toApiUrl("/api/notifications/read-all"), {
    method: "PATCH",
    headers: jsonHeaders(token),
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const errorText = await res.text();
    logger.error("Mark All As Read Error", errorText);
    throw new Error(`Failed to mark all as read: ${String(res.status)}`);
  }

  if (res.status === 204) {
    return { success: true };
  }

  const data = (await res.json()) as { updated?: number };
  return { success: true, updated: data.updated };
};

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

export const seedNotifications = async (token: string): Promise<SeedNotificationsResponse> => {
  const res = await fetch(toApiUrl("/api/notifications/seed"), {
    method: "POST",
    headers: jsonHeaders(token),
  });

  if (!res.ok) {
    throw new Error(`Failed to seed notifications: ${String(res.status)}`);
  }

  return (await res.json()) as SeedNotificationsResponse;
};
