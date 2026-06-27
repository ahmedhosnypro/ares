"use client";

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress } from "@mui/material";

interface DeleteBookingDialogProps {
  readonly open: boolean;
  readonly isDeleting: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly t: (key: string) => string;
  readonly tCommon: (key: string) => string;
}

export default function DeleteBookingDialog({
  open,
  isDeleting,
  onClose,
  onConfirm,
  t,
  tCommon,
}: DeleteBookingDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!isDeleting) onClose();
      }}
      slotProps={{ paper: { sx: { borderRadius: 2, p: 1, minWidth: 350 } } }}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>{t("deleteDialog.title")}</DialogTitle>
      <DialogContent>
        {t("deleteDialog.content")}
        <br />
        <strong>{t("deleteDialog.subcontent")}</strong>
      </DialogContent>
      <DialogActions>
        <Button disabled={isDeleting} onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
          {tCommon("cancel")}
        </Button>
        <Button
          disabled={isDeleting}
          onClick={onConfirm}
          color="error"
          variant="contained"
          sx={{ borderRadius: 2, fontWeight: 700, minWidth: 100 }}
        >
          {isDeleting ? <CircularProgress size={24} color="inherit" /> : tCommon("delete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
