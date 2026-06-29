"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  alpha,
  type Theme,
} from "@mui/material";
import { useTranslations } from "next-intl";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { type User } from "@/api-clients/users/users";

interface UserDeleteDialogProps {
  readonly target: User | null;
  readonly deleting: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}

export default function UserDeleteDialog({ target, deleting, onClose, onConfirm }: UserDeleteDialogProps) {
  const t = useTranslations("dashboardAdmin.users");

  return (
    <Dialog open={target !== null} onClose={onClose} maxWidth="xs" fullWidth aria-labelledby="delete-user-dialog-title">
      <DialogTitle
        id="delete-user-dialog-title"
        sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}
      >
        <WarningAmberIcon color="error" />
        {t("dialogs.deleteTitle")}
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("dialogs.deleteConfirmText")}
        </Typography>

        {target && (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: (rowTheme: Theme) => alpha(rowTheme.palette.text.primary, 0.02),
            }}
          >
            <Stack spacing={1}>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  {t("dialogs.name")}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, textAlign: "right" }}>
                  {target.firstName} {target.lastName}
                </Typography>
              </Box>
              <Divider flexItem />
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  {t("dialogs.email")}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, textAlign: "right", wordBreak: "break-all" }}>
                  {target.email}
                </Typography>
              </Box>
              <Divider flexItem />
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  {t("details.role")}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, textAlign: "right", textTransform: "capitalize" }}>
                  {target.roles.join(", ") || "—"}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}

        <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mt: 2 }}>
          {t("dialogs.deleteWarningText")}
        </Alert>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={deleting} color="inherit">
          {t("details.cancel")}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={deleting}
          variant="contained"
          color="error"
          startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlinedIcon />}
        >
          {deleting ? t("dialogs.deleting") : t("dialogs.deleteConfirmBtn")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
