"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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
import { useRouter } from "@/shared/i18n/routing";

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
}: Readonly<CustomerDriverSelectionSectionProps>) {
  const t = useTranslations("customer.bookingDetail");
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

  const fetchDrivers = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(toApiUrl(`/api/bookings/${bookingId}/drivers`), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(t("driverSelection.errorLoadDrivers"));
      const data = (await res.json()) as { drivers?: PublicDriver[] };
      setDrivers(data.drivers ?? []);
    } catch (err) {
      logger.error("Error fetching drivers", err);
      setError(t("driverSelection.errorLoadDrivers"));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, bookingId, t]);

  useEffect(() => {
    // Only fetch the interested-driver list when no driver is currently
    // assigned (i.e. the customer still needs to choose / re-choose).
    if (!assignedDriverProfile) {
      void fetchDrivers();
    }
  }, [bookingId, accessToken, assignedDriverProfile, fetchDrivers]);

  const handleSelectDriver = async (driverId: string) => {
    setIsSelecting(true);
    setError("");
    try {
      const res = await fetch(toApiUrl(`/api/bookings/${bookingId}/drivers/${driverId}/select`), {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        const d: { message?: string } = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(d.message ?? t("driverSelection.errorSelectDriver"));
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("driverSelection.errorSelectDriver"));
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
          reason: changeReason.trim() || t("driverSelection.changeReasonDefault"),
        }),
      });

      if (!res.ok) {
        const d: { message?: string } = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(d.message ?? t("driverSelection.errorChangeDriver"));
      }

      setChangeDialogOpen(false);
      setChangeReason("");
      // Booking is now WaitingForDriver with no assigned driver — refresh so
      // the parent re-renders this section into the selection list.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("driverSelection.errorChangeDriver"));
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
                {t("driverSelection.assignedDriver")}
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
                {!assignedDriverProfile.profilePictureUrl && assignedDriverProfile.firstName[0]}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {assignedDriverProfile.firstName} {assignedDriverProfile.lastName}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Rating value={assignedDriverProfile.averageRating} readOnly size="small" precision={0.5} />
                  <Typography variant="caption" color="text.secondary">
                    ({assignedDriverProfile.totalTrips} {t("driverSelection.trips")})
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
                {t("driverSelection.changeDriver")}
              </Button>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={changeDialogOpen}
          onClose={() => {
            if (!isChanging) setChangeDialogOpen(false);
          }}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>{t("driverSelection.changeDriverTitle")}</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>{t("driverSelection.changeDriverDescription")}</DialogContentText>
            <TextField
              autoFocus
              fullWidth
              multiline
              minRows={2}
              label={t("driverSelection.reasonOptional")}
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
              {t("driverSelection.cancel")}
            </Button>
            <Button
              onClick={() => {
                void handleChangeDriver();
              }}
              variant="contained"
              color="primary"
              disabled={isChanging}
            >
              {isChanging ? <CircularProgress size={20} color="inherit" /> : t("driverSelection.confirmChange")}
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
            {t("driverSelection.selectDriverTitle")}
          </Typography>
        </Stack>

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : drivers.length === 0 ? (
          <Alert severity="info">{t("driverSelection.searchingDrivers")}</Alert>
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
                      {!driver.profilePictureUrl && driver.firstName[0]}
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
                    onClick={() => {
                      void handleSelectDriver(driver.driverProfileId);
                    }}
                  >
                    {t("driverSelection.selectDriver")} {driver.firstName}
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
