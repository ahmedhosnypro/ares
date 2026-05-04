"use client";

import React, { useEffect, useState, useCallback, SyntheticEvent } from "react";
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
} from "@mui/material";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import { useSession } from "next-auth/react";
import { getNotifications, markNotificationAsRead, seedNotifications } from "@/api-clients/notfications/notfications";
import { logger } from "@/utils/logger";

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const token = session?.accessToken;

  const fetchData = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
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
      setError("Failed to load notifications. Please try again later.");
      logger.error("Fetch Error", err);
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
      setProcessingId(id); // Start loading state for this specific item
      await markNotificationAsRead(id, token);

      // Update local state immediately for a snappy feel
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      logger.error("Update failed", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSeed = async () => {
    if (!token) return;
    try {
      setSeeding(true);
      await seedNotifications(token);
      await fetchData();
    } catch (err) {
      logger.error("Seed failed", err);
      setError("Failed to create dummy notifications.");
    } finally {
      setSeeding(false);
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
            Loading your feed...
          </Typography>
        </Box>
      );
    }

    if (notifications.length === 0) {
      return (
        <Box sx={{ p: 10, textAlign: "center" }}>
          <Typography color="text.secondary">You&apos;re all caught up! No notifications.</Typography>
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
                  {new Date(n.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
              </Box>

              {/* Actions */}
              <Box>
                {!n.isRead ? (
                  <Tooltip title="Mark as Read">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => {
                        void handleMarkRead(n.id);
                      }}
                      disabled={processingId === n.id}
                    >
                      {processingId === n.id ? <CircularProgress size={20} color="inherit" /> : <DoneAllIcon />}
                    </IconButton>
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
      {/* Header Section */}
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "800", display: "flex", alignItems: "center", gap: 2 }}>
          <NotificationsActiveIcon color="primary" fontSize="large" />
          Notifications
        </Typography>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Chip
            label={`${unreadCount.toString()} Unread`}
            color={unreadCount > 0 ? "primary" : "default"}
            sx={{ fontWeight: "bold" }}
          />
          <Tooltip title="Create dummy notifications for testing">
            <IconButton
              onClick={(e: SyntheticEvent) => {
                e.preventDefault();
                void handleSeed();
              }}
              disabled={seeding}
              color="primary"
              sx={{ bgcolor: "action.hover" }}
            >
              {seeding ? <CircularProgress size={20} /> : <span style={{ fontSize: "18px" }}>🔄</span>}
            </IconButton>
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
      <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        {renderContent()}
      </Card>
    </Container>
  );
}
