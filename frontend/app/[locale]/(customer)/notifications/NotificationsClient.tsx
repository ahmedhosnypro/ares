"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Card,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  Snackbar,
} from "@mui/material";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { useSession } from "next-auth/react";
import { useRouter } from "@/shared/i18n/routing";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification,
  type NotificationItem,
} from "@/api-clients/notfications/notfications";
import { logger } from "@/utils/logger";
import { formatUtcDateTime, parseUtcDate } from "@/utils/dateTime";
import { getNotificationTypeConfig } from "@/utils/notification-type-config";
import DeleteNotificationDialog from "@/components/notifications/DeleteNotificationDialog";
import { useTranslations, useLocale } from "next-intl";

export default function NotificationsClient() {
  const t = useTranslations("customer.notifications");
  const locale = useLocale();
  const { data: session, status } = useSession();
  const token = session?.accessToken;
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  // Deletion and toast state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingNotification, setDeletingNotification] = useState<NotificationItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchData = useCallback(
    async (background = false) => {
      if (!token) return;
      try {
        if (!background) setLoading(true);
        const data = await getNotifications(token);
        const list: NotificationItem[] = Array.isArray(data) ? data : data.notifications;
        list.sort((a, b) => parseUtcDate(b.createdAt).getTime() - parseUtcDate(a.createdAt).getTime());
        setNotifications(list);
        setError(null);
      } catch (err) {
        logger.error("Notifications fetch error", err);
        if (!background) setError(t("fetchError"));
      } finally {
        if (!background) setLoading(false);
      }
    },
    [t, token]
  );

  useEffect(() => {
    if (status === "authenticated") {
      void fetchData();
    }
  }, [status, fetchData]);

  useEffect(() => {
    const handleUpdate = () => {
      void fetchData(true);
    };
    window.addEventListener("notifications-updated", handleUpdate);
    return () => {
      window.removeEventListener("notifications-updated", handleUpdate);
    };
  }, [fetchData]);

  const handleMarkRead = async (id: string) => {
    if (!token || processingId) return;
    try {
      setProcessingId(id);
      await markNotificationAsRead(id, token);
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    } catch (err) {
      logger.error("Mark as read failed", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleItemClick = async (item: NotificationItem) => {
    // 1. Mark as read first if unread
    if (!item.isRead && token && !processingId) {
      try {
        setProcessingId(item.id);
        await markNotificationAsRead(item.id, token);
        setNotifications(prev => prev.map(n => (n.id === item.id ? { ...n, isRead: true } : n)));
        window.dispatchEvent(new CustomEvent("notifications-updated"));
      } catch (err) {
        logger.error("Mark as read failed", err);
      } finally {
        setProcessingId(null);
      }
    }

    // 2. Navigate if deep link is available
    if (item.type) {
      const parts = item.type.split(":");
      const tag = parts[0];
      const entityId = parts[1];

      // Handle tags that redirect to profile (may not have entityId)
      if (["IdentityVerified", "IdentityRejected", "LicenseVerified", "LicenseRejected"].includes(tag)) {
        router.push("/account/profile");
        return;
      }

      if (entityId) {
        if (
          [
            "BookingPending",
            "BookingPendingPayment",
            "BookingApproved",
            "BookingRejected",
            "BookingCompleted",
            "ReviewAvailable",
            "ReviewReceived",
            "SupplierReply",
            "InspectionApproved",
            "InspectionRejected",
          ].includes(tag)
        ) {
          router.push(`/booking/${entityId}`);
        }
      }

      if (["DriverEarningReceived", "DriverPayoutCompleted", "DriverPayoutRejected"].includes(tag)) {
        router.push("/driver/earnings");
      }
    }
  };

  const handleMarkAll = async () => {
    if (!token || markingAll) return;
    try {
      setMarkingAll(true);
      await markAllNotificationsAsRead(token);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    } catch (err) {
      logger.error("Mark all as read failed", err);
      setError(t("markAllError"));
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, item: NotificationItem) => {
    e.stopPropagation();
    setDeletingNotification(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!token || !deletingNotification) return;
    setDeleting(true);
    try {
      await deleteNotification(deletingNotification.id, token);

      // Update local state immediately
      setNotifications(prev => prev.filter(n => n.id !== deletingNotification.id));
      setToast({
        open: true,
        message: t("deleteSuccess"),
        severity: "success",
      });
      window.dispatchEvent(new CustomEvent("notifications-updated"));
      setDeleteDialogOpen(false);
    } catch (err) {
      logger.error("Failed to delete notification", err);
      // Graceful handling of 404 (already deleted)
      if (err instanceof Error && err.message.includes("404")) {
        setNotifications(prev => prev.filter(n => n.id !== deletingNotification.id));
        setToast({
          open: true,
          message: t("deleteSuccess"),
          severity: "success",
        });
        window.dispatchEvent(new CustomEvent("notifications-updated"));
        setDeleteDialogOpen(false);
      } else {
        setToast({
          open: true,
          message: t("deleteError"),
          severity: "error",
        });
      }
    } finally {
      setDeleting(false);
    }
  };

  if (status === "loading") {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (status === "unauthenticated") {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="info">{t("signInRequired")}</Alert>
      </Container>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const renderContent = (): React.ReactNode => {
    if (loading) {
      return (
        <Box sx={{ p: 10, textAlign: "center" }}>
          <CircularProgress size={30} />
          <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
            {t("loading")}
          </Typography>
        </Box>
      );
    }

    if (notifications.length === 0) {
      return (
        <Box sx={{ p: 10, textAlign: "center" }}>
          <NotificationsActiveIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
          <Typography color="text.secondary">{t("empty")}</Typography>
        </Box>
      );
    }

    return (
      <>
        {notifications.map((n, index) => (
          <React.Fragment key={n.id}>
            <Stack
              direction="row"
              spacing={2}
              sx={{
                alignItems: "center",
                p: 3,
                transition: "background-color 0.2s ease",
                bgcolor: n.isRead ? "transparent" : "action.hover",
                "&:hover": { bgcolor: "action.selected" },
                cursor: "pointer",
              }}
              onClick={() => {
                void handleItemClick(n);
              }}
            >
              {(() => {
                const cfg = getNotificationTypeConfig(n.type);
                return (
                  <Avatar
                    sx={{ ...{ width: 36, height: 36, flexShrink: 0 }, ...(cfg.avatarSx as Record<string, unknown>) }}
                  >
                    {React.createElement(cfg.icon, { fontSize: "small" })}
                  </Avatar>
                );
              })()}
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: n.isRead ? 500 : 700 }}
                  color={n.isRead ? "text.secondary" : "text.primary"}
                >
                  {n.title}
                </Typography>
                <Typography variant="body2" sx={{ my: 0.5, color: "text.secondary" }}>
                  {n.message}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.disabled" }}>
                  {formatUtcDateTime(n.createdAt, locale, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                {!n.isRead ? (
                  <Tooltip title={t("markAsReadTooltip")}>
                    <span>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={e => {
                          e.stopPropagation();
                          void handleMarkRead(n.id);
                        }}
                        disabled={processingId === n.id}
                      >
                        {processingId === n.id ? <CircularProgress size={20} color="inherit" /> : <DoneAllIcon />}
                      </IconButton>
                    </span>
                  </Tooltip>
                ) : (
                  <Typography variant="caption" color="text.disabled" sx={{ fontStyle: "italic" }}>
                    {t("read")}
                  </Typography>
                )}
                <Tooltip title={t("deleteTooltip")}>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={e => {
                      handleDeleteClick(e, n);
                    }}
                  >
                    <DeleteOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
            {index < notifications.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </>
    );
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 2 }}>
          <NotificationsActiveIcon color="primary" fontSize="large" />
          {t("title")}
        </Typography>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Chip
            label={t("unreadCount", { count: unreadCount.toString() })}
            color={unreadCount > 0 ? "primary" : "default"}
            sx={{ fontWeight: 700 }}
          />
          <Tooltip title={t("markAllAsReadTooltip")}>
            <span>
              <IconButton
                onClick={() => {
                  void handleMarkAll();
                }}
                disabled={markingAll || unreadCount === 0}
                color="primary"
                sx={{ bgcolor: "action.hover" }}
              >
                {markingAll ? <CircularProgress size={20} /> : <DoneAllIcon />}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() => {
            setError(null);
          }}
        >
          {error}
        </Alert>
      )}

      <Card elevation={0} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
        {renderContent()}
      </Card>

      <DeleteNotificationDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
        }}
        onConfirm={() => {
          void handleDeleteConfirm();
        }}
        notificationTitle={deletingNotification?.title ?? ""}
        loading={deleting}
      />

      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={() => {
          setToast(prev => ({ ...prev, open: false }));
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => {
            setToast(prev => ({ ...prev, open: false }));
          }}
          severity={toast.severity}
          sx={{ width: "100%" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
