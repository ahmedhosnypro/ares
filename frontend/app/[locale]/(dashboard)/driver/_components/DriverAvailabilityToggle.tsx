"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  Box,
  Switch,
  Typography,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";
import type { DriverAvailabilityStatus } from "@/api-clients/driver-dashboard/driver-dashboard";

interface DriverAvailabilityToggleProps {
  readonly initialAvailability: DriverAvailabilityStatus;
  readonly onAvailabilityChange?: (newAvailability: string) => void;
}

export default function DriverAvailabilityToggle({
  initialAvailability,
  onAvailabilityChange,
}: DriverAvailabilityToggleProps) {
  const { data: session } = useSession();
  const t = useTranslations("dashboard.driverDashboard.availability");
  const [availability, setAvailability] = useState(initialAvailability);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);

  useEffect(() => {
    setAvailability(initialAvailability);
  }, [initialAvailability]);

  const isReserved = availability === "Reserved";
  const isAvailable = availability === "Available";

  const handleToggle = () => {
    if (isReserved) return;
    setConfirmDialog(true);
  };

  const confirmToggle = async () => {
    setConfirmDialog(false);
    if (!session?.accessToken) return;

    setIsLoading(true);
    const targetAvailability = isAvailable ? "Unavailable" : "Available";

    try {
      const res = await fetch(toApiUrl("/api/driver/profile/availability"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ availability: targetAvailability }),
      });

      if (!res.ok) throw new Error(t("failedToUpdateAvailability"));

      const data = (await res.json()) as { availability: DriverAvailabilityStatus };
      setAvailability(data.availability);
      onAvailabilityChange?.(data.availability);
    } catch (err) {
      logger.error("Availability toggle error", err);
    } finally {
      setIsLoading(false);
    }
  };

  const targetStatusLabel = isAvailable ? t("unavailable") : t("available");

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      {isLoading && <CircularProgress size={20} />}
      <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>
        {t("status")}
      </Typography>

      {isReserved ? (
        <Chip label={t("reserved")} color="warning" size="small" sx={{ fontWeight: 700 }} />
      ) : (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Switch
            checked={isAvailable}
            onChange={handleToggle}
            disabled={isLoading}
            color="success"
            aria-label={t("toggleAvailability")}
          />
          <Chip
            label={isAvailable ? t("available") : t("unavailable")}
            color={isAvailable ? "success" : "default"}
            size="small"
            sx={{ fontWeight: 700 }}
          />
        </Box>
      )}

      <Dialog
        open={confirmDialog}
        onClose={() => {
          setConfirmDialog(false);
        }}
      >
        <DialogTitle>{t("confirmAvailabilityChange")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("changeStatusTo", { status: targetStatusLabel })}
            <br />
            {isAvailable ? t("youWillNotReceiveRequests") : t("youWillStartReceivingRequests")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setConfirmDialog(false);
            }}
            color="inherit"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={() => {
              void confirmToggle();
            }}
            variant="contained"
            color="primary"
            autoFocus
          >
            {t("confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
