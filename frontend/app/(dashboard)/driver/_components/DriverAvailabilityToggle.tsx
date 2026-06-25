"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
  const [availability, setAvailability] = useState(initialAvailability);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);

  // Sync state when initialAvailability prop changes from parent (e.g. after API fetch finishes)
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

      if (!res.ok) throw new Error("Failed to update availability");

      const data = await res.json();
      setAvailability(data.availability);
      onAvailabilityChange?.(data.availability);
    } catch (err) {
      logger.error("Availability toggle error", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      {isLoading && <CircularProgress size={20} />}
      <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>
        Status:
      </Typography>

      {isReserved ? (
        <Chip label="Reserved" color="warning" size="small" sx={{ fontWeight: 700 }} />
      ) : (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Switch
            checked={isAvailable}
            onChange={handleToggle}
            disabled={isLoading}
            color="success"
            aria-label="Toggle availability"
          />
          <Chip
            label={isAvailable ? "Available" : "Unavailable"}
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
        <DialogTitle>Confirm Availability Change</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to change your status to {isAvailable ? "Unavailable" : "Available"}?
            {isAvailable ? " You will not receive any new requests." : " You will start receiving ride requests."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setConfirmDialog(false);
            }}
            color="inherit"
          >
            Cancel
          </Button>
          <Button onClick={confirmToggle} variant="contained" color="primary" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
