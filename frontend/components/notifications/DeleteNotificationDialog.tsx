"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
  Box,
} from "@mui/material";

interface DeleteNotificationDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly notificationTitle: string;
  readonly loading?: boolean;
}

export default function DeleteNotificationDialog({
  open,
  onClose,
  onConfirm,
  notificationTitle,
  loading = false,
}: DeleteNotificationDialogProps) {
  const t = useTranslations("deleteNotificationDialog");
  const tc = useTranslations("common");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          elevation: 6,
          sx: {
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          },
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, px: 3, pt: 3, pb: 2 }}>{t("title")}</DialogTitle>
      <DialogContent sx={{ px: 3, py: 1 }}>
        <DialogContentText sx={{ color: "text.primary", mb: 2 }}>{t("confirmMessage")}</DialogContentText>
        <Box
          sx={{
            fontWeight: 600,
            color: "text.primary",
            fontStyle: "italic",
            mb: 2,
            pl: 2,
            py: 0.5,
            borderLeft: "4px solid",
            borderColor: "primary.main",
            fontSize: "0.95rem",
          }}
        >
          &ldquo;{notificationTitle}&rdquo;
        </Box>
        <DialogContentText sx={{ color: "text.secondary", fontSize: "0.875rem" }}>{t("cannotUndo")}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
          sx={{
            borderColor: "border.main",
            color: "text.secondary",
            fontWeight: 600,
            textTransform: "none",
            "&:hover": {
              bgcolor: "action.hover",
              borderColor: "border.main",
            },
          }}
        >
          {tc("cancel")}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color="error"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{
            color: "common.white",
            fontWeight: 600,
            textTransform: "none",
            boxShadow: "none",
            "&:hover": {
              boxShadow: "none",
            },
          }}
        >
          {tc("delete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
