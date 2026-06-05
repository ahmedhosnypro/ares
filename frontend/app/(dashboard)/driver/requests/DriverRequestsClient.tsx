"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Container,
  Paper,
  Typography,
  Chip,
  Stack,
  Divider,
  Grid,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  LocationOn as LocationIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckIcon,
} from "@mui/icons-material";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";
import { format, differenceInDays } from "date-fns";

interface DriverRequest {
  id: string;
  bookingId: string;
  pickupDate: string;
  returnDate: string;
  pickupLocationText?: string;
  pickupServiceAreaName?: string;
  status: "Open" | "Fulfilled" | "Expired" | "Cancelled";
  expiresAt: string;
  estimatedEarnings: number;
  hasResponded: boolean;
}

export default function DriverRequestsClient() {
  const { data: session } = useSession();
  const theme = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<DriverRequest[]>([]);
  const [error, setError] = useState("");
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    if (!session?.accessToken) return;
    try {
      const res = await fetch(toApiUrl("/api/driver/requests/available"), {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!res.ok) throw new Error("Failed to load requests");

      const data = await res.json();
      setRequests(data);
    } catch (err) {
      logger.error("Error fetching driver requests", err);
      setError("Could not load available requests.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchRequests();
  }, [session]);

  const handleAccept = async (id: string) => {
    if (!session?.accessToken) return;
    setAcceptingId(id);
    setError("");

    try {
      const res = await fetch(toApiUrl(`/api/driver/requests/${id}/accept`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to accept request");
      }

      // Optimistically update the UI
      setRequests(prev => prev.map(req => (req.id === id ? { ...req, hasResponded: true } : req)));
    } catch (err) {
      logger.error("Accept request error", err);
      setError(err instanceof Error ? err.message : "Failed to accept request.");
    } finally {
      setAcceptingId(null);
    }
  };

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
        Available Requests
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Review and accept ride requests in your work areas.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {requests.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 8,
            textAlign: "center",
            borderRadius: 4,
            border: `1px dashed ${theme.palette.divider}`,
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No requests available right now
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Make sure you are marked as "Available" and check back later.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {requests.map(request => {
            const pDate = new Date(request.pickupDate);
            const rDate = new Date(request.returnDate);
            const days = Math.max(1, differenceInDays(rDate, pDate));

            return (
              <Grid size={{ xs: 12, md: 6 }} key={request.id}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: theme.palette.shadow.card,
                    border: `1px solid ${theme.palette.border.light}`,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, alignItems: "flex-start" }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {request.pickupServiceAreaName || "Custom Location"}
                      </Typography>
                      <Chip
                        label={`$${request.estimatedEarnings.toFixed(2)}`}
                        color="success"
                        sx={{ fontWeight: 700, fontSize: "1rem" }}
                      />
                    </Box>

                    <Stack spacing={2} sx={{ mb: 3 }}>
                      <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                        <LocationIcon color="action" fontSize="small" sx={{ mt: 0.25 }} />
                        <Typography variant="body2" color="text.secondary">
                          {request.pickupLocationText || request.pickupServiceAreaName || "Location not specified"}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                        <EventIcon color="action" fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                          {format(pDate, "MMM d, yyyy h:mm a")} — {format(rDate, "MMM d, yyyy h:mm a")}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                        <TimeIcon color="action" fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                          {days} {days === 1 ? "day" : "days"} duration
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>

                  <Divider />

                  <CardActions sx={{ p: 2, bgcolor: "background.default" }}>
                    {request.hasResponded ? (
                      <Button
                        fullWidth
                        disabled
                        startIcon={<CheckIcon />}
                        sx={{ py: 1, fontWeight: 700, borderRadius: 2 }}
                      >
                        Interest Sent
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        onClick={() => handleAccept(request.id)}
                        disabled={acceptingId === request.id}
                        sx={{ py: 1, fontWeight: 700, borderRadius: 2 }}
                      >
                        {acceptingId === request.id ? <CircularProgress size={24} color="inherit" /> : "Accept Request"}
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
}
