"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Typography,
  Chip,
  Stack,
  Tabs,
  Tab,
  Divider,
  Grid,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LocationOn as LocationIcon, Event as EventIcon, Person as PersonIcon } from "@mui/icons-material";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";
import { useDateFnsLocale } from "@/hooks/useDateFnsLocale";

interface DriverAssignment {
  bookingId: string;
  bookingNumber: string;
  pickupDate: string;
  returnDate: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  customerName: string;
  customerPhone: string;
  vehicleName: string;
  earnings: number;
  status: string;
}

export default function DriverTripsClient() {
  const { data: session } = useSession();
  const theme = useTheme();
  const t = useTranslations("dashboard.driverTrips");
  const tc = useTranslations("common");
  const { formatLocalized } = useDateFnsLocale();
  const locale = useLocale();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  const statusMap: Record<string, string> = {
    Confirmed: t("statusConfirmed"),
    Approved: t("statusApproved"),
    ReadyForDelivery: t("statusReadyForDelivery"),
    Active: t("statusActive"),
    Completed: t("statusCompleted"),
    Cancelled: t("statusCancelled"),
  };

  const translateStatus = (status: string) => statusMap[status] ?? status;

  const [isLoading, setIsLoading] = useState(true);
  const [assignments, setAssignments] = useState<DriverAssignment[]>([]);
  const [error, setError] = useState("");
  const [tabIndex, setTabIndex] = useState(0);

  const fetchAssignments = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const res = await fetch(toApiUrl("/api/driver/assignments"), {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!res.ok) throw new Error(t("failedToLoadAssignments"));

      const data = (await res.json()) as DriverAssignment[];
      setAssignments(data);
    } catch (err) {
      logger.error("Error fetching driver assignments", err);
      setError(t("couldNotLoadTrips"));
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken, t]);

  const handleCancelTrip = useCallback(
    async (bookingId: string) => {
      if (!confirm(t("cancelTripConfirm"))) return;
      try {
        const res = await fetch(toApiUrl(`/api/driver/assignments/${bookingId}/cancel`), {
          method: "POST",
          headers: { Authorization: `Bearer ${session?.accessToken}` },
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { message?: string };
          throw new Error(err.message ?? t("failedToCancel"));
        }
        void fetchAssignments();
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : t("failedToCancelTrip"));
      }
    },
    [session?.accessToken, fetchAssignments, t]
  );

  useEffect(() => {
    void fetchAssignments();
  }, [fetchAssignments]);

  const assignedTrips = useMemo(
    () => assignments.filter(a => ["Confirmed", "Approved", "ReadyForDelivery"].includes(a.status)),
    [assignments]
  );
  const activeTrips = useMemo(() => assignments.filter(a => ["Active"].includes(a.status)), [assignments]);
  const completedTrips = useMemo(
    () => assignments.filter(a => ["Completed", "Cancelled"].includes(a.status)),
    [assignments]
  );

  const currentTrips = tabIndex === 0 ? assignedTrips : tabIndex === 1 ? activeTrips : completedTrips;

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 1 }}>
        {t("title")}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        {t("description")}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 4 }}>
        <Tabs
          value={tabIndex}
          onChange={(_, nv: number) => {
            setTabIndex(nv);
          }}
          aria-label={t("ariaLabel")}
        >
          <Tab label={`${t("upcoming")} (${assignedTrips.length})`} />
          <Tab label={`${t("active")} (${activeTrips.length})`} />
          <Tab label={`${t("completed")} (${completedTrips.length})`} />
        </Tabs>
      </Box>

      {currentTrips.length === 0 ? (
        <Box sx={{ py: 8, textAlign: "center", bgcolor: "background.paper", borderRadius: 2 }}>
          <Typography variant="h6" color="text.secondary">
            {t("noTripsFound")}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {currentTrips.map(trip => {
            const pDate = new Date(trip.pickupDate);
            const rDate = new Date(trip.returnDate);

            return (
              <Grid size={{ xs: 12, md: 6 }} key={trip.bookingId}>
                <Card
                  sx={{
                    borderRadius: 2,
                    boxShadow: theme.palette.shadow.card,
                    border: `1px solid ${theme.palette.border.light}`,
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>
                        {trip.bookingNumber}
                      </Typography>
                      <Chip
                        label={translateStatus(trip.status)}
                        size="small"
                        color={
                          trip.status === "Active" ? "primary" : trip.status === "Completed" ? "success" : "default"
                        }
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                      {trip.vehicleName}
                    </Typography>

                    <Stack spacing={1.5} sx={{ mb: 3 }}>
                      <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                        <PersonIcon color="action" fontSize="small" sx={{ mt: 0.25 }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {trip.customerName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {trip.customerPhone}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                        <EventIcon color="action" fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                          {formatLocalized(pDate, "MMM d, h:mm a")} — {formatLocalized(rDate, "MMM d, h:mm a")}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                        <LocationIcon color="action" fontSize="small" sx={{ mt: 0.25 }} />
                        <Typography variant="body2" color="text.secondary">
                          {t("pickup")}: {trip.pickupLocation || tc("na")}
                          <br />
                          {t("dropoff")}: {trip.dropoffLocation || tc("na")}
                        </Typography>
                      </Box>
                    </Stack>

                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {t("driverFee")}
                      </Typography>
                      <Typography variant="h6" color="success.main" sx={{ fontWeight: 800 }}>
                        {formatCurrency(trip.earnings)}
                      </Typography>
                    </Box>
                  </CardContent>

                  {["Confirmed", "Approved"].includes(trip.status) && (
                    <Box sx={{ p: 2, bgcolor: "background.default", borderTop: `1px solid ${theme.palette.divider}` }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        onClick={() => {
                          void handleCancelTrip(trip.bookingId);
                        }}
                      >
                        {t("cancelTrip")}
                      </Button>
                    </Box>
                  )}
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
}
