"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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
  Alert,
  Snackbar,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { Link } from "@/shared/i18n/routing";
import { useSession } from "next-auth/react";
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  type NotificationItem,
} from "@/api-clients/notfications/notfications";
import { logger } from "@/utils/logger";
import DeleteNotificationDialog from "@/components/notifications/DeleteNotificationDialog";

const POLL_INTERVAL_MS = 60_000;
const PREVIEW_LIMIT = 6;

const DEFAULT_NOTIFICATIONS_HREF = "/admin/notifications";

function timeAgo(input: string, t: ReturnType<typeof useTranslations>): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 30) return t("justNow");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes.toString()}${t("minutesAgo")}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours.toString()}${t("hoursAgo")}`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days.toString()}${t("daysAgo")}`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type NotificationsBellProps = {
  readonly allNotificationsHref?: string;
  readonly allNotificationsLabel?: string;
};

export default function NotificationsBell({
  allNotificationsHref = DEFAULT_NOTIFICATIONS_HREF,
  allNotificationsLabel: allNotificationsLabelProp,
}: NotificationsBellProps) {
  const theme = useTheme();
  const { data: session } = useSession();
  const token = session?.accessToken;
  const t = useTranslations("common");
  const allNotificationsLabelDefault = allNotificationsLabelProp ?? t("viewAllNotifications");

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState(false);

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
        setError(false);
        const data = await getNotifications(token);
        const list: NotificationItem[] = Array.isArray(data) ? data : data.notifications;
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setItems(list);
      } catch (err) {
        logger.error("NotificationsBell: fetch failed", err);
        if (!background) setError(true);
      } finally {
        if (!background) setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (!token) return;
    void fetchData();
    const id = window.setInterval(() => {
      void fetchData(true);
    }, POLL_INTERVAL_MS);
    return () => {
      window.clearInterval(id);
    };
  }, [token, fetchData]);

  useEffect(() => {
    const handleUpdate = () => {
      void fetchData(true);
    };
    window.addEventListener("notifications-updated", handleUpdate);
    return () => {
      window.removeEventListener("notifications-updated", handleUpdate);
    };
  }, [fetchData]);

  const open = Boolean(anchorEl);
  const unreadCount = items.filter(n => !n.isRead).length;

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    void fetchData();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleItemClick = async (item: NotificationItem) => {
    if (item.isRead || !token) return;
    setItems(prev => prev.map(n => (n.id === item.id ? { ...n, isRead: true } : n)));
    try {
      await markNotificationAsRead(item.id, token);
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    } catch (err) {
      logger.error("NotificationsBell: mark-as-read failed; reverting", err);
      setItems(prev => prev.map(n => (n.id === item.id ? { ...n, isRead: false } : n)));
    }
  };

  const handleMarkAll = async () => {
    if (!token || markingAll) return;
    const unread = items.filter(n => !n.isRead);
    if (unread.length === 0) return;
    setMarkingAll(true);
    setItems(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await Promise.all(unread.map(n => markNotificationAsRead(n.id, token)));
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    } catch (err) {
      logger.error("NotificationsBell: mark-all failed; refetching", err);
      await fetchData();
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
      setItems(prev => prev.filter(n => n.id !== deletingNotification.id));
      setToast({
        open: true,
        message: t("notificationDeletedSuccessfully"),
        severity: "success",
      });
      window.dispatchEvent(new CustomEvent("notifications-updated"));
      setDeleteDialogOpen(false);
    } catch (err) {
      logger.error("Failed to delete notification", err);
      // Graceful handling of 404 (already deleted)
      if (err instanceof Error && err.message.includes("404")) {
        setItems(prev => prev.filter(n => n.id !== deletingNotification.id));
        setToast({
          open: true,
          message: t("notificationDeletedSuccessfully"),
          severity: "success",
        });
        window.dispatchEvent(new CustomEvent("notifications-updated"));
        setDeleteDialogOpen(false);
      } else {
        setToast({
          open: true,
          message: t("failedToDeleteNotification"),
          severity: "error",
        });
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Tooltip title={t("notifications")}>
        <IconButton
          aria-label={t("notifications")}
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
        anchorOrigin={{ vertical: "bottom", horizontal: theme.direction === "rtl" ? "left" : "right" }}
        transformOrigin={{ vertical: "top", horizontal: theme.direction === "rtl" ? "left" : "right" }}
        transitionDuration={200}
        slotProps={{
          paper: {
            elevation: 6,
            sx: {
              mt: 1.5,
              width: { xs: "calc(100vw - 32px)", sm: 380 },
              maxWidth: "calc(100vw - 16px)",
              maxHeight: 520,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            },
          },
        }}
      >
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
              {t("notifications")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {unreadCount > 0 ? `${unreadCount.toString()} ${t("unreadMessages")}` : t("allCaughtUp")}
            </Typography>
          </Box>
          <Tooltip title={t("markAllAsRead")}>
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

        <Box sx={{ overflowY: "auto", flexGrow: 1, minHeight: 120 }}>
          {loading && items.length === 0 && (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 6 }}>
              <CircularProgress size={26} />
            </Box>
          )}

          {!loading && error && (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="body2" color="error">
                {t("failedToLoadNotifications")}
              </Typography>
              <Button size="small" onClick={() => void fetchData()} sx={{ mt: 1 }}>
                {t("tryAgain")}
              </Button>
            </Box>
          )}

          {!loading && !error && items.length === 0 && (
            <Box sx={{ p: 5, textAlign: "center" }}>
              <NotificationsIcon sx={{ fontSize: 36, color: "text.disabled", mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {t("noNotificationsYet")}
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
                          flexGrow: 1,
                        }}
                      >
                        {n.title || t("notifications")}
                      </Typography>
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", flexShrink: 0 }}>
                        {!n.isRead && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              bgcolor: "primary.main",
                            }}
                          />
                        )}
                        <IconButton
                          size="small"
                          color="error"
                          onClick={e => {
                            handleDeleteClick(e, n);
                          }}
                          sx={{
                            p: 0.25,
                            opacity: 0.6,
                            "&:hover": { opacity: 1, bgcolor: "action.hover" },
                          }}
                        >
                          <DeleteOutlinedIcon sx={{ fontSize: "0.95rem" }} />
                        </IconButton>
                      </Stack>
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
                      {timeAgo(n.createdAt, t)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </Box>

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
            href={allNotificationsHref}
            onClick={handleClose}
            fullWidth
            size="small"
            endIcon={<OpenInNewIcon fontSize="small" />}
            sx={{ fontWeight: 600, textTransform: "none" }}
          >
            {allNotificationsLabelDefault}
          </Button>
        </Box>
      </Popover>

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
    </>
  );
}
