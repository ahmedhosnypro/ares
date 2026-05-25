"use client";

import { useEffect, useRef } from "react";
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Box } from "@mui/material";
import { Logout as LogoutIcon } from "@mui/icons-material";

interface LogoutConfirmDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: () => void;
}

export default function LogoutConfirmDialog({ open, onOpenChange, onConfirm }: LogoutConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const logoutRef = useRef<HTMLButtonElement>(null);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  // Handle keyboard navigation for arrows
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const currentFocus = document.activeElement;
        if (currentFocus === cancelRef.current) {
          logoutRef.current?.focus();
        } else {
          cancelRef.current?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="logout-dialog-title"
      aria-describedby="logout-dialog-description"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            p: 1,
            minWidth: { xs: "90%", sm: 400 },
          },
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, px: 3, pt: 2 }}>
        <Box
          sx={{
            bgcolor: "error.lighter",
            color: "error.main",
            p: 1.5,
            borderRadius: "50%",
            display: "flex",
          }}
        >
          <LogoutIcon />
        </Box>
        <DialogTitle id="logout-dialog-title" sx={{ p: 0, fontWeight: 700 }}>
          Confirm Logout
        </DialogTitle>
      </Box>
      <DialogContent sx={{ mt: 2 }}>
        <DialogContentText id="logout-dialog-description">
          Are you sure you want to log out of your account? You will need to sign in again to access your dashboard.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button
          ref={cancelRef}
          onClick={handleClose}
          variant="outlined"
          color="inherit"
          fullWidth
          sx={{ fontWeight: 600 }}
          autoFocus
        >
          Cancel
        </Button>
        <Button
          ref={logoutRef}
          onClick={handleConfirm}
          variant="contained"
          color="error"
          fullWidth
          sx={{
            fontWeight: 600,
            bgcolor: "error.main",
            "&:hover": { bgcolor: "error.dark" },
          }}
        >
          Logout
        </Button>
      </DialogActions>
    </Dialog>
  );
}
