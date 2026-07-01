"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Card,
  Typography,
  Stack,
  Chip,
  CircularProgress,
  IconButton,
  Divider,
  Container,
  Alert,
  Tooltip,
  Button,
  Snackbar,
} from "@mui/material";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { formatUtcDateTime } from "@/utils/dateTime";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/api-clients/notfications/notfications";
import { logger } from "@/utils/logger";
import DeleteNotificationDialog from "@/components/notifications/DeleteNotificationDialog";

// Type definition based on your Schema
type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

interface NotificationResponse {
  notifications?: Notification[];
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const t = useTranslations("dashboardAdmin.notifications");
  const locale = useLocale();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  // Deletion and toast state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingNotification, setDeletingNotification] = useState<Notification | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const token = session?.accessToken;

  const fetchData = useCallback(
    async (background = false) => {
      if (!token) return;

      try {
        if (!background) setLoading(true);
        const data = (await getNotifications(token)) as Notification[] | NotificationResponse;
        // Handles both direct array response or nested object response
        let notificationData: Notification[] = [];
        if (Array.isArray(data)) {
          notificationData = data;
        } else if (data.notifications) {
          notificationData = data.notifications;
        }
        setNotifications(notificationData);
        setError(null);
      } catch (err) {
        if (!background) setError(t("loadError"));
        logger.error("Fetch Error", err);
      } finally {
        if (!background) setLoading(false);
      }
    },
    [token, t]
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
      setProcessingId(id); // Start loading state for this specific item
      await markNotificationAsRead(id, token);

      // Update local state immediately for a snappy feel
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    } catch (err) {
      logger.error("Update failed", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkAll = async () => {
    if (!token || markingAll) return;
    const hasUnread = notifications.some(n => !n.isRead);
    if (!hasUnread) return;

    setMarkingAll(true);
    // Optimistic update — keep the list responsive.
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await markAllNotificationsAsRead(token);
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    } catch (err) {
      logger.error("Mark all as read failed; refetching", err);
      await fetchData();
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, item: Notification) => {
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

  // 1. Loading State (Session)
  if (status === "loading") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  // 2. Unauthenticated State
  if (status === "unauthenticated") {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="info">{t("signInPrompt")}</Alert>
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
            {t("loadingFeed")}
          </Typography>
        </Box>
      );
    }

    if (notifications.length === 0) {
      return (
        <Box sx={{ p: 10, textAlign: "center" }}>
          <Typography color="text.secondary">{t("allCaughtUp")}</Typography>
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
                transition: "0.2s",
                bgcolor: n.isRead ? "transparent" : "action.hover",
                "&:hover": { bgcolor: "border.light" },
              }}
            >
              {/* Content */}
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

              {/* Actions */}
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                {!n.isRead ? (
                  <Tooltip title={t("markAsReadTooltip")}>
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
                  </Tooltip>
                ) : (
                  <Typography variant="caption" color="text.disabled" sx={{ fontStyle: "italic" }}>
                    {t("readStatus")}
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
      {/* Header Section */}
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "800", display: "flex", alignItems: "center", gap: 2 }}>
          <NotificationsActiveIcon color="primary" fontSize="large" />
          {t("title")}
        </Typography>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Chip
            label={`${unreadCount.toString()} ${t("unread")}`}
            color={unreadCount > 0 ? "primary" : "default"}
            sx={{ fontWeight: "bold" }}
          />
          <Tooltip title={t("refresh")}>
            <span>
              <IconButton
                onClick={() => {
                  void fetchData();
                }}
                disabled={loading}
                color="primary"
                sx={{ bgcolor: "action.hover" }}
              >
                {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={t("markAllRead")}>
            <span>
              <Button
                variant="outlined"
                size="small"
                startIcon={markingAll ? <CircularProgress size={16} /> : <DoneAllIcon />}
                onClick={() => {
                  void handleMarkAll();
                }}
                disabled={markingAll || unreadCount === 0}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                {t("markAllRead")}
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Error Alert */}
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

      {/* Main List */}
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
