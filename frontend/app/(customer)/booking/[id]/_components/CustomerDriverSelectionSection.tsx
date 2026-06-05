"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
  Avatar,
  Stack,
  Rating,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Grid,
} from "@mui/material";
import { DirectionsCar as CarIcon, PersonSearch as PersonSearchIcon } from "@mui/icons-material";
import { toApiUrl } from "@/utils/api-client";
import { toImageUrl } from "@/utils/image-url";
import { logger } from "@/utils/logger";
import { useRouter } from "next/navigation";

interface PublicDriver {
  driverProfileId: string;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string;
  averageRating: number;
  totalTrips: number;
}

interface CustomerDriverSelectionSectionProps {
  bookingId: string;
  accessToken: string;
  assignedDriverProfile?: PublicDriver;
  canChangeDriver: boolean;
}

export default function CustomerDriverSelectionSection({
  bookingId,
  accessToken,
  assignedDriverProfile,
  canChangeDriver,
}: CustomerDriverSelectionSectionProps) {
  const router = useRouter();
  const [drivers, setDrivers] = useState<PublicDriver[]>([]);
  const [isLoading, setIsLoading] = useState(!assignedDriverProfile);
  const [error, setError] = useState("");
  const [isSelecting, setIsSelecting] = useState(false);

  // Change-driver dialog (the backend /change endpoint only RELEASES the
  // current driver + re-opens the search; the customer then re-selects from
  // the freshly-interested drivers via /select).
  const [changeDialogOpen, setChangeDialogOpen] = useState(false);
  const [changeReason, setChangeReason] = useState("");
  const [isChanging, setIsChanging] = useState(false);

  const fetchDrivers = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(toApiUrl(`/api/bookings/${bookingId}/drivers`), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to load interested drivers.");
      const data = await res.json();
      setDrivers(data);
    } catch (err) {
      logger.error("Error fetching drivers", err);
      setError("Could not load drivers at this time.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch the interested-driver list when no driver is currently
    // assigned (i.e. the customer still needs to choose / re-choose).
    if (!assignedDriverProfile) {
      void fetchDrivers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, accessToken, assignedDriverProfile]);

  const handleSelectDriver = async (driverId: string) => {
    setIsSelecting(true);
    setError("");
    try {
      const res = await fetch(toApiUrl(`/api/bookings/${bookingId}/drivers/${driverId}/select`), {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to select driver");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete driver selection");
    } finally {
      setIsSelecting(false);
    }
  };

  const handleChangeDriver = async () => {
    setIsChanging(true);
    setError("");
    try {
      const res = await fetch(toApiUrl(`/api/bookings/${bookingId}/drivers/change`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          reason: changeReason.trim() || "Customer requested a different driver",
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to change driver");
      }

      setChangeDialogOpen(false);
      setChangeReason("");
      // Booking is now WaitingForDriver with no assigned driver — refresh so
      // the parent re-renders this section into the selection list.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change driver");
    } finally {
      setIsChanging(false);
    }
  };

  if (assignedDriverProfile) {
    return (
      <>
        <Card sx={{ mt: 3, border: "1px solid", borderColor: "primary.main", boxShadow: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 2 }}>
              <CarIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Assigned Driver
              </Typography>
            </Stack>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <Avatar
                src={
                  assignedDriverProfile.profilePictureUrl
                    ? toImageUrl(assignedDriverProfile.profilePictureUrl)
                    : undefined
                }
                sx={{ width: 64, height: 64 }}
              >
                {!assignedDriverProfile.profilePictureUrl && assignedDriverProfile.firstName?.[0]}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {assignedDriverProfile.firstName} {assignedDriverProfile.lastName}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Rating value={assignedDriverProfile.averageRating} readOnly size="small" precision={0.5} />
                  <Typography variant="caption" color="text.secondary">
                    ({assignedDriverProfile.totalTrips} trips)
                  </Typography>
                </Box>
              </Box>
            </Box>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {canChangeDriver && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setChangeDialogOpen(true);
                }}
              >
                Change Driver
              </Button>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={changeDialogOpen}
          onClose={() => !isChanging && setChangeDialogOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Change Driver</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              This will release your current driver and re-open the search so you can choose another. You can only
              change a driver up to 24 hours before pickup.
            </DialogContentText>
            <TextField
              autoFocus
              fullWidth
              multiline
              minRows={2}
              label="Reason (optional)"
              value={changeReason}
              onChange={e => {
                setChangeReason(e.target.value);
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setChangeDialogOpen(false);
              }}
              color="inherit"
              disabled={isChanging}
            >
              Cancel
            </Button>
            <Button onClick={handleChangeDriver} variant="contained" color="primary" disabled={isChanging}>
              {isChanging ? <CircularProgress size={20} color="inherit" /> : "Confirm Change"}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return (
    <Card sx={{ mt: 3, border: "1px solid", borderColor: "border.main", boxShadow: 1 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 2 }}>
          <PersonSearchIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Select Your Driver
          </Typography>
        </Stack>

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : drivers.length === 0 ? (
          <Alert severity="info">
            We are currently searching for drivers for your booking. Please check back later.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {drivers.map(driver => (
              <Grid size={{ xs: 12, sm: 6 }} key={driver.driverProfileId}>
                <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                    <Avatar
                      src={driver.profilePictureUrl ? toImageUrl(driver.profilePictureUrl) : undefined}
                      sx={{ width: 48, height: 48 }}
                    >
                      {!driver.profilePictureUrl && driver.firstName?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {driver.firstName} {driver.lastName}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Rating value={driver.averageRating} readOnly size="small" precision={0.5} />
                        <Typography variant="caption">({driver.totalTrips})</Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    fullWidth
                    size="small"
                    disabled={isSelecting}
                    onClick={() => handleSelectDriver(driver.driverProfileId)}
                  >
                    Select {driver.firstName}
                  </Button>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
}
