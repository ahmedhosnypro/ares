"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
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
import { format } from "date-fns";

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

      if (!res.ok) throw new Error("Failed to load assignments");

      const data = await res.json();
      setAssignments(data);
    } catch (err) {
      logger.error("Error fetching driver assignments", err);
      setError("Could not load your trips.");
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    fetchAssignments().catch(logger.error);
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
        My Trips
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Manage your assigned, active, and completed ride requests.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 4 }}>
        <Tabs
          value={tabIndex}
          onChange={(_, nv) => {
            setTabIndex(nv);
          }}
          aria-label="driver trips tabs"
        >
          <Tab label={`Upcoming (${assignedTrips.length})`} />
          <Tab label={`Active (${activeTrips.length})`} />
          <Tab label={`Completed (${completedTrips.length})`} />
        </Tabs>
      </Box>

      {currentTrips.length === 0 ? (
        <Box sx={{ py: 8, textAlign: "center", bgcolor: "background.paper", borderRadius: 3 }}>
          <Typography variant="h6" color="text.secondary">
            No trips found in this category.
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
                    borderRadius: 3,
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
                        label={trip.status}
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
                          {format(pDate, "MMM d, h:mm a")} — {format(rDate, "MMM d, h:mm a")}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                        <LocationIcon color="action" fontSize="small" sx={{ mt: 0.25 }} />
                        <Typography variant="body2" color="text.secondary">
                          Pickup: {trip.pickupLocation || "N/A"}
                          <br />
                          Dropoff: {trip.dropoffLocation || "N/A"}
                        </Typography>
                      </Box>
                    </Stack>

                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Driver Fee
                      </Typography>
                      <Typography variant="h6" color="success.main" sx={{ fontWeight: 800 }}>
                        ${trip.earnings.toFixed(2)}
                      </Typography>
                    </Box>
                  </CardContent>

                  {["Confirmed", "Approved"].includes(trip.status) && (
                    <Box sx={{ p: 2, bgcolor: "background.default", borderTop: `1px solid ${theme.palette.divider}` }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        onClick={async () => {
                          if (
                            !confirm(
                              "Are you sure you want to cancel this trip? This action cannot be undone and is only allowed at least 24h before pickup."
                            )
                          )
                            return;
                          try {
                            const res = await fetch(toApiUrl(`/api/driver/assignments/${trip.bookingId}/cancel`), {
                              method: "POST",
                              headers: { Authorization: `Bearer ${session?.accessToken}` },
                            });
                            if (!res.ok) {
                              const err = await res.json().catch(() => ({}));
                              throw new Error(err.message || "Failed to cancel");
                            }
                            fetchAssignments();
                          } catch (e: any) {
                            alert(e.message);
                          }
                        }}
                      >
                        Cancel Trip
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
