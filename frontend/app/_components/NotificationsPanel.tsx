"use client";
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Badge,
  Typography,
  Divider,
  Alert,
  alpha,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  getNotifications,
  markNotificationAsRead,
  seedNotifications as seedNotificationsApi,
  NotificationItem,
} from "@/api-clients/notfications/notfications";
import { logger } from "@/utils/logger";

export default function NotificationsPanel() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const loadNotifications = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const data = await getNotifications(session.accessToken);
      if (Array.isArray(data)) {
        setNotifications(data);
      } else if ("notifications" in data) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      logger.error("Failed to fetch notifications", err);
      setError("Failed to load notifications");
    }
  }, [session]);

  useEffect(() => {
    if (session?.accessToken) {
      const timer = setTimeout(() => {
        void loadNotifications();
      }, 0);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [session?.accessToken, loadNotifications]);

  const handleRead = async (id: string, isRead: boolean) => {
    if (!session?.accessToken || isRead) return;
    try {
      await markNotificationAsRead(id, session.accessToken);
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      logger.error("Failed to mark as read", err);
    }
  };

  const handleSeedNotifications = async () => {
    if (!session?.accessToken) {
      setError("You must be logged in to perform this action");
      return;
    }
    try {
      await seedNotificationsApi(session.accessToken);
      await loadNotifications();
    } catch (err) {
      logger.error("Failed to seed notifications", err);
      setError("Failed to generate test notifications");
    }
  };

  const handleToggleOpen = () => {
    const newState = !open;
    setOpen(newState);
    if (newState && session?.accessToken) {
      void loadNotifications();
    }
  };

  if (session && !session.user.id) {
    return <Alert severity="error">User ID missing from session. Please sign in again.</Alert>;
  }

  return (
    <>
      <IconButton onClick={handleToggleOpen} color="inherit">
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => {
          setOpen(false);
        }}
      >
        <Box sx={{ width: { xs: 300, sm: 350 }, p: 2 }}>
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              onClose={() => {
                setError(null);
              }}
            >
              {error}
            </Alert>
          )}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Notifications
            </Typography>
            <IconButton
              size="small"
              onClick={() => {
                void handleSeedNotifications();
              }}
              title="Generate Test Notifications"
            >
              <span style={{ fontSize: "14px" }}>🔄</span>
            </IconButton>
          </Box>
          <Divider />
          <List>
            {notifications.map(n => (
              <ListItem
                key={n.id}
                onClick={() => {
                  void handleRead(n.id, n.isRead);
                }}
                sx={{
                  cursor: "pointer",
                  bgcolor: theme => (n.isRead ? "transparent" : alpha(theme.palette.primary.main, 0.08)),
                  borderRadius: 2,
                  mb: 1,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <ListItemText
                  primary={n.title}
                  secondary={n.message}
                  slotProps={{
                    primary: {
                      sx: {
                        fontWeight: n.isRead ? "regular" : "bold",
                        color: n.isRead ? "text.secondary" : "text.primary",
                      },
                    },
                    secondary: {
                      sx: {
                        display: "block",
                        mt: 0.5,
                        color: "text.secondary",
                      },
                    },
                  }}
                />
              </ListItem>
            ))}
            {notifications.length === 0 && (
              <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>No notifications yet.</Box>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
