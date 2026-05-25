"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
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
} from "@mui/material";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationItem,
} from "@/api-clients/notfications/notfications";
import { logger } from "@/utils/logger";

export default function NotificationsClient() {
  const { data: session, status } = useSession();
  const token = session?.accessToken;
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await getNotifications(token);
      const list: NotificationItem[] = Array.isArray(data) ? data : data.notifications;
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(list);
      setError(null);
    } catch (err) {
      logger.error("Notifications fetch error", err);
      setError("Failed to load notifications. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (status === "authenticated") {
      void fetchData();
    }
  }, [status, fetchData]);

  const handleMarkRead = async (id: string) => {
    if (!token || processingId) return;
    try {
      setProcessingId(id);
      await markNotificationAsRead(id, token);
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
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
      if (entityId) {
        if (
          [
            "BookingPending",
            "BookingPendingPayment",
            "BookingApproved",
            "BookingRejected",
            "BookingCompleted",
            "ReviewAvailable",
            "InspectionApproved",
            "InspectionRejected",
          ].includes(tag)
        ) {
          router.push(`/booking/${entityId}`);
        }
      }
    }
  };

  const handleMarkAll = async () => {
    if (!token || markingAll) return;
    try {
      setMarkingAll(true);
      await markAllNotificationsAsRead(token);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      logger.error("Mark all as read failed", err);
      setError("Failed to mark all as read.");
    } finally {
      setMarkingAll(false);
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
        <Alert severity="info">Please sign in to view your notifications.</Alert>
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
            Loading your notifications...
          </Typography>
        </Box>
      );
    }

    if (notifications.length === 0) {
      return (
        <Box sx={{ p: 10, textAlign: "center" }}>
          <NotificationsActiveIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
          <Typography color="text.secondary">You&apos;re all caught up. No notifications yet.</Typography>
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
                  {new Date(n.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
              </Box>

              <Box>
                {!n.isRead ? (
                  <Tooltip title="Mark as read">
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
                    Read
                  </Typography>
                )}
              </Box>
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
          Notifications
        </Typography>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Chip
            label={`${unreadCount.toString()} Unread`}
            color={unreadCount > 0 ? "primary" : "default"}
            sx={{ fontWeight: 700 }}
          />
          <Tooltip title="Mark all as read">
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
    </Container>
  );
}
