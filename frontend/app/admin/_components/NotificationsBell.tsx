"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  IconButton,
  Popover,
  Typography,
  Divider,
  CircularProgress,
  Stack,
  Avatar,
  Button,
  alpha,
  useTheme,
  Tooltip,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  getNotifications,
  markNotificationAsRead,
  type NotificationItem,
} from "@/api-clients/notfications/notfications";
import { logger } from "@/utils/logger";

const POLL_INTERVAL_MS = 60_000;
const PREVIEW_LIMIT = 6;

function timeAgo(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 30) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes.toString()}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours.toString()}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days.toString()}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotificationsBell() {
  const theme = useTheme();
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(false);
      const data = await getNotifications(token);
      const list: NotificationItem[] = Array.isArray(data) ? data : data.notifications;
      // Newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setItems(list);
    } catch (err) {
      logger.error("NotificationsBell: fetch failed", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initial fetch + poll while mounted
  useEffect(() => {
    if (!token) return;
    void fetchData();
    const id = window.setInterval(() => {
      void fetchData();
    }, POLL_INTERVAL_MS);
    return () => {
      window.clearInterval(id);
    };
  }, [token, fetchData]);

  const open = Boolean(anchorEl);
  const unreadCount = items.filter(n => !n.isRead).length;

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    // Refresh on open so the user always sees the freshest data
    void fetchData();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleItemClick = async (item: NotificationItem) => {
    if (item.isRead || !token) return;
    // Optimistic update
    setItems(prev => prev.map(n => (n.id === item.id ? { ...n, isRead: true } : n)));
    try {
      await markNotificationAsRead(item.id, token);
    } catch (err) {
      logger.error("NotificationsBell: mark-as-read failed; reverting", err);
      // Revert if it failed
      setItems(prev => prev.map(n => (n.id === item.id ? { ...n, isRead: false } : n)));
    }
  };

  const handleMarkAll = async () => {
    if (!token || markingAll) return;
    const unread = items.filter(n => !n.isRead);
    if (unread.length === 0) return;
    setMarkingAll(true);
    // Optimistic
    setItems(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await Promise.all(unread.map(n => markNotificationAsRead(n.id, token)));
    } catch (err) {
      logger.error("NotificationsBell: mark-all failed; refetching", err);
      // Reconcile by refetching
      await fetchData();
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          aria-label="notifications"
          onClick={handleOpen}
          sx={{
            color: "text.secondary",
            transition: "transform 0.2s ease, color 0.2s ease",
            "&:hover": {
              color: "primary.main",
              transform: "scale(1.05)",
            },
          }}
        >
          <Box
            sx={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {unreadCount > 0 ? <NotificationsActiveIcon /> : <NotificationsIcon />}
            {unreadCount > 0 && (
              <Box
                sx={{
                  position: "absolute",
                  top: -4,
                  right: -6,
                  minWidth: 18,
                  height: 18,
                  bgcolor: "error.main",
                  color: "common.white",
                  borderRadius: "50%",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  px: 0.5,
                  border: "2px solid",
                  borderColor: "background.paper",
                  boxShadow: `0 2px 6px ${alpha(theme.palette.error.main, 0.4)}`,
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Box>
            )}
          </Box>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        transitionDuration={200}
        slotProps={{
          paper: {
            elevation: 6,
            sx: {
              mt: 1.5,
              width: { xs: "calc(100vw - 32px)", sm: 380 },
              maxWidth: "calc(100vw - 16px)",
              maxHeight: 520,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            },
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2.5,
            py: 1.75,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Notifications
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {unreadCount > 0 ? `${unreadCount.toString()} unread messages` : "You're all caught up"}
            </Typography>
          </Box>
          <Tooltip title="Mark all as read">
            <span>
              <IconButton
                size="small"
                onClick={() => {
                  void handleMarkAll();
                }}
                disabled={markingAll || unreadCount === 0}
              >
                {markingAll ? <CircularProgress size={16} /> : <DoneAllIcon fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* Body */}
        <Box sx={{ overflowY: "auto", flexGrow: 1, minHeight: 120 }}>
          {loading && items.length === 0 && (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 6 }}>
              <CircularProgress size={26} />
            </Box>
          )}

          {!loading && error && (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="body2" color="error">
                Failed to load notifications.
              </Typography>
              <Button size="small" onClick={() => void fetchData()} sx={{ mt: 1 }}>
                Try again
              </Button>
            </Box>
          )}

          {!loading && !error && items.length === 0 && (
            <Box sx={{ p: 5, textAlign: "center" }}>
              <NotificationsIcon sx={{ fontSize: 36, color: "text.disabled", mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No notifications yet.
              </Typography>
            </Box>
          )}

          {!loading && !error && items.length > 0 && (
            <Stack divider={<Divider />}>
              {items.slice(0, PREVIEW_LIMIT).map(n => (
                <Box
                  key={n.id}
                  onClick={() => {
                    void handleItemClick(n);
                  }}
                  sx={{
                    display: "flex",
                    gap: 1.5,
                    px: 2.5,
                    py: 1.5,
                    cursor: n.isRead ? "default" : "pointer",
                    bgcolor: n.isRead ? "transparent" : alpha(theme.palette.primary.main, 0.05),
                    transition: "background-color 0.18s ease",
                    "&:hover": {
                      bgcolor: n.isRead ? "action.hover" : alpha(theme.palette.primary.main, 0.09),
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      color: "primary.main",
                      flexShrink: 0,
                    }}
                  >
                    <NotificationsActiveIcon fontSize="small" />
                  </Avatar>
                  <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: n.isRead ? 500 : 700,
                          color: "text.primary",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {n.title || "Notification"}
                      </Typography>
                      {!n.isRead && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: "primary.main",
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </Box>
                    {n.message && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 2,
                          overflow: "hidden",
                          lineHeight: 1.4,
                          mt: 0.25,
                        }}
                      >
                        {n.message}
                      </Typography>
                    )}
                    <Typography
                      variant="caption"
                      sx={{ display: "block", mt: 0.5, color: "text.disabled", fontSize: "0.7rem" }}
                    >
                      {timeAgo(n.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </Box>

        {/* Footer */}
        <Box
          sx={{
            borderTop: "1px solid",
            borderColor: "divider",
            p: 1.25,
            bgcolor: "background.paper",
          }}
        >
          <Button
            component={Link}
            href="/admin/notifications"
            onClick={handleClose}
            fullWidth
            size="small"
            endIcon={<OpenInNewIcon fontSize="small" />}
            sx={{ fontWeight: 600, textTransform: "none" }}
          >
            View all notifications
          </Button>
        </Box>
      </Popover>
    </>
  );
}
