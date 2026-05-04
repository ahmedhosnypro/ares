"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  MenuItem,
  Select,
  Button,
  CircularProgress,
  TextField,
  Stack,
  Divider,
  Chip,
  Alert,
  Grid,
  useTheme,
  alpha,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { apiFetchJson } from "@/utils/api-client";
import { logger } from "@/utils/logger";
import { type Booking } from "@/api-clients/bookings/bookings";

export default function EditBookingClient({ bookingId }: { readonly bookingId: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const theme = useTheme();

  // States
  const [bookingDetails, setBookingDetails] = useState<Booking | null>(null);
  const [status, setStatus] = useState("");
  const [remarks, setRemarks] = useState("");

  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Fetch Data
  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId || bookingId === "undefined") {
        setErrorMsg("Invalid Booking ID. Please go back to the table and select a valid booking.");
        setIsFetching(false);
        return;
      }

      if (!session?.accessToken) return;

      try {
        const data = await apiFetchJson<Booking>(`/api/admin/bookings/${bookingId}`, {
          accessToken: session.accessToken,
        });
        setBookingDetails(data);
        setStatus(data.status);
      } catch (error) {
        logger.error("Error fetching booking details", error);
        setErrorMsg("Failed to load booking details.");
      } finally {
        setIsFetching(false);
      }
    };

    void fetchBookingDetails();
  }, [bookingId, session?.accessToken]);

  // 2. Update Status
  const handleUpdateStatus = () => {
    void (async () => {
      setIsSaving(true);
      setErrorMsg(null);
      try {
        const payload = { status, remarks };

        await apiFetchJson(`/api/admin/bookings/${bookingId}/status`, {
          method: "PUT",
          accessToken: session?.accessToken ?? undefined,
          body: JSON.stringify(payload),
        });

        router.push("/admin/bookings");
        router.refresh();
      } catch (error) {
        logger.error("Error updating status", error);
        setErrorMsg("Failed to update booking status. Please try again.");
      } finally {
        setIsSaving(false);
      }
    })();
  };

  if (isFetching) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!bookingDetails) {
    return (
      <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
        <Alert severity="error">{errorMsg || "Booking not found!"}</Alert>
        <Button
          variant="outlined"
          sx={{ mt: 2 }}
          onClick={() => {
            router.push("/admin/bookings");
          }}
        >
          Go Back to Bookings
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: "auto" }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
        Manage Booking
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Update status and add remarks for booking ID:{" "}
        <Typography component="span" sx={{ fontWeight: "bold" }} color="text.primary">
          {bookingId.split("-")[0]}
        </Typography>
        ...
      </Typography>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMsg}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* الكارت الأول: تفاصيل الحجز */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              height: "100%",
              // السحر هنا: بنغير اللون بناءً على الـ Mode
              bgcolor:
                theme.palette.mode === "dark" ? alpha(theme.palette.background.paper, 0.4) : "background.default",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Booking Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Stack spacing={2.5}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  Vehicle
                </Typography>
                <Typography sx={{ fontWeight: 600 }} color="text.primary">
                  {bookingDetails.car?.name || "N/A"}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  Driver
                </Typography>
                <Typography sx={{ fontWeight: 600 }} color="text.primary">
                  {bookingDetails.driver?.fullName || "N/A"}
                  <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    ({bookingDetails.driver?.phone || "No Phone"})
                  </Typography>
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  Dates
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }} color="text.primary">
                  {new Date(bookingDetails.from).toLocaleDateString()} —{" "}
                  {new Date(bookingDetails.to).toLocaleDateString()}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  Current Status
                </Typography>
                <Chip
                  label={bookingDetails.status}
                  color={
                    bookingDetails.status === "Paid" || bookingDetails.status === "Confirmed" ? "success" : "warning"
                  }
                  size="small"
                  sx={{ mt: 0.5, fontWeight: 600 }}
                />
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* الكارت التاني: فورم التعديل */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              height: "100%",
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "shadow.card",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Update Status
            </Typography>

            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  New Status *
                </Typography>
                <Select
                  fullWidth
                  value={status}
                  onChange={e => {
                    setStatus(e.target.value);
                  }}
                  size="medium"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Confirmed">Confirmed</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </Select>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Admin Remarks (Optional)
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Add any notes about this status change..."
                  value={remarks}
                  onChange={e => {
                    setRemarks(e.target.value);
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Box>

              <Box sx={{ display: "flex", gap: 2, pt: 2 }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => {
                    router.push("/admin/bookings");
                  }}
                  sx={{ borderRadius: 2, px: 3 }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleUpdateStatus}
                  disabled={isSaving || !status || status === bookingDetails.status}
                  sx={{ borderRadius: 2, px: 4, fontWeight: 700, flexGrow: 1 }}
                >
                  {isSaving ? <CircularProgress size={24} color="inherit" /> : "Save Changes"}
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
