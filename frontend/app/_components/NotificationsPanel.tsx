"use client";
import { Box, Drawer, IconButton, List, ListItem, ListItemText, Badge, Typography, Divider } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { apiFetchJson } from "@/utils/api-client";

export default function NotificationsPanel() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const loadNotifications = async () => {
    if (!session?.accessToken) return;
    try {
      const data = await apiFetchJson<any[]>("api/notifications", {
        method: "GET",
        accessToken: session.accessToken,
      });
      setNotifications(data || []);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    if (session?.accessToken) {
      loadNotifications();
    }
  }, [session?.accessToken]);

  const handleRead = async (id: string, isRead: boolean) => {
    if (!session?.accessToken || isRead) return;
    try {
      await apiFetchJson(`api/notifications/${id}/read`, {
        method: "PUT",
        accessToken: session.accessToken,
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date() } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const seedNotifications = async () => {
    if (!session?.accessToken) return;
    try {
      await apiFetchJson(`api/notifications/seed`, {
        method: "POST",
        accessToken: session.accessToken,
      });
      loadNotifications();
    } catch (err) {
      console.error("Failed to seed notifications", err);
    }
  };

  return (
    <>
      <IconButton onClick={() => { setOpen(true); loadNotifications(); }} color="inherit">
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: { xs: 300, sm: 350 }, p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">Notifications</Typography>
            <IconButton size="small" onClick={seedNotifications} title="Generate Test Notifications">
              <span style={{ fontSize: '14px' }}>🔄</span>
            </IconButton>
          </Box>
          <Divider />
          <List>
            {notifications.map((n) => (
              <ListItem
                key={n.id}
                onClick={() => handleRead(n.id, n.isRead)}
                sx={{
                  cursor: "pointer",
                  bgcolor: n.isRead ? "transparent" : "rgba(25, 118, 210, 0.08)",
                  borderRadius: 2,
                  mb: 1,
                  "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)" }
                }}
              >
                <ListItemText
                  primary={n.title}
                  secondary={n.message}
                  primaryTypographyProps={{
                    fontWeight: n.isRead ? "regular" : "bold",
                    color: n.isRead ? "text.secondary" : "text.primary"
                  }}
                  secondaryTypographyProps={{
                    display: "block",
                    mt: 0.5,
                    color: "text.secondary"
                  }}
                />
              </ListItem>
            ))}
            {notifications.length === 0 && (
              <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
                No notifications yet.
              </Box>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
